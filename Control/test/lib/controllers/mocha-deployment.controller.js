/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const assert = require('assert');
const sinon = require('sinon');
const { User } = require('./../../../lib/dtos/User.js');
const { DeploymentController } = require('./../../../lib/controllers/Deployment.controller.js');

describe('DeploymentController test suite', function() {
  let deploymentController, req, res;
  let mockDeploymentService;
  let mockWorkflowService;

  beforeEach(function () {
    mockDeploymentService = { deployEnvironment: sinon.stub() };
    mockWorkflowService = { getDefaultTemplateSource: sinon.stub() };
    deploymentController = new DeploymentController(mockDeploymentService, mockWorkflowService);
    req = {
      body: {},
      session: { username: 'testuser', name: 'Test User', personid: '123' }
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe(`'newDeploymentHandler' - test suite`, async function () {
    it('should return 400 if template is missing', async function () {
      req.body = {};
      await deploymentController.newAsyncDeploymentHandler(req, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({
        message: 'Invalid input: template must be provided',
        status: 400,
        title: 'Invalid Input'
      }));
    });

    it('should call deployEnvironment with correct parameters', async function () {
      const repository = 'default-repo';
      const revision = '0.1';
      const template = 'readout-dataflow';
      req.body = {
        template,
        repository,
        revision,
        detectors: ['TST'],
        userVars: { var1: 'value1' }
      };
      mockDeploymentService.deployEnvironment.returns({ id: 'env123' });

      await deploymentController.newAsyncDeploymentHandler(req, res);

      assert.ok(mockDeploymentService.deployEnvironment.calledOnce);
      assert.deepStrictEqual(mockDeploymentService.deployEnvironment.firstCall.args[0], {
        workflowTemplate: `${repository}/workflows/${template}@${revision}`,
        selectedConfiguration: undefined,
        shouldAutoTransition: undefined,
        userVars: { var1: 'value1' },
        detectors: ['TST'],
        user: new User(req.session.username, req.session.name, req.session.personid)
      });

      assert.ok(res.status.calledWith(201));
      assert.ok(res.json.calledWith({ id: 'env123' }));
    });

    it('should handle errors from deployEnvironment', async function () {
      const repository = 'default-repo';
      const revision = '0.1';
      const template = 'readout-dataflow';
      const error = new Error('Deployment failed');
      mockDeploymentService.deployEnvironment.throws(error);
      req.body = {
        repository,
        revision,
        template,
        userVars: { var1: 'value1' }
      };
      await deploymentController.newAsyncDeploymentHandler(req, res);

      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({
        message: 'Deployment failed',
        status: 500,
        title: 'Unknown Error'
      }));
    });

    it('should successfully fetch revision and repository if one missing', async function () {
      const repository = 'default-repo';
      const revision = '0.1';
      const template = 'readout-dataflow';
      req.body = {
        template,
        detectors: ['TST'],
        userVars: { var1: 'value1' }
      };
      mockDeploymentService.deployEnvironment.returns({ id: 'env123' });
      mockWorkflowService.getDefaultTemplateSource.resolves({ repository, revision });

      await deploymentController.newAsyncDeploymentHandler(req, res);

      assert.ok(mockDeploymentService.deployEnvironment.calledOnce);
      assert.deepStrictEqual(mockDeploymentService.deployEnvironment.firstCall.args[0], {
        workflowTemplate: `${repository}/workflows/${template}@${revision}`,
        selectedConfiguration: undefined,
        shouldAutoTransition: undefined,
        userVars: { var1: 'value1' },
        detectors: ['TST'],
        user: new User(req.session.username, req.session.name, req.session.personid)
      });

      assert.ok(res.status.calledWith(201));
      assert.ok(res.json.calledWith({ id: 'env123' }));
    });

    it('should respond with error when workflow service is unable to fetch revision and repository', async function () {
      const error = new Error('Workflow service error');
      mockWorkflowService.getDefaultTemplateSource.rejects(error);
      req.body = {
        template: 'readout-dataflow',
        userVars: { var1: 'value1' }
      };
      await deploymentController.newAsyncDeploymentHandler(req, res);

      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({
        message: 'Workflow service error',
        status: 500,
        title: 'Unknown Error'
      }));
    });
  });

  describe('acknowledgeDeploymentFailureHandler - tests', function() {
    let deploymentServiceMock, res;
    beforeEach(function() {
      deploymentServiceMock = { acknowledgeEnvironmentDeploymentFailure: sinon.stub() };
      deploymentController._deploymentService = deploymentServiceMock;
      req.params = { id: 'env1' };
      res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
    });

    it('should return status 400 and not found message if id is missing from request params', async function() {
      req.params = {};
      await deploymentController.acknowledgeDeploymentFailureHandler({params: {}}, res);
      assert.ok(res.status.calledWith(400));
    });

    it('should call acknowledgeEnvironmentDeploymentFailure with correct arguments', async function() {
      await deploymentController.acknowledgeDeploymentFailureHandler({
        params: { id: 'env1' },
        session: { username: 'testuser', name: 'Test User', personid: '123' } 
      }, res);
      
      assert.strictEqual(deploymentServiceMock.acknowledgeEnvironmentDeploymentFailure.firstCall.args[0], 'env1');
      assert.ok(deploymentServiceMock.acknowledgeEnvironmentDeploymentFailure.firstCall.args[1] instanceof User);
    });

    it('should return 204 and acknowledgement message on success', async function() {
      await deploymentController.acknowledgeDeploymentFailureHandler(req, res);
      assert.ok(res.status.calledWith(204));
      assert.ok(res.json.calledWith({ message: 'Environment deployment failure acknowledged' }));
    });
  });
});
