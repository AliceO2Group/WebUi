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
const {InvalidInputError} = require('@aliceo2/web-ui');
const {DeploymentService} = require('./../../../lib/services/Deployment.service.js');

describe(`'DeploymentService' test suite`, () => {
    
  describe(`'_retrieveUserVars' test suite`, async () => {
    it('should return the same userVars if selectedConfiguration is not provided', async () => {
      const deploymentService = new DeploymentService();
      const userVars = { var1: 'value1', var2: 'value2' };
      const selectedConfiguration = null;

      const result = await deploymentService._retrieveUserVars(userVars, selectedConfiguration);

      assert.deepStrictEqual(result, userVars);
    });
    it('should throw an error if selectedConfiguration is provided but service to retrieve userVars is not available', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveWorkflowSavedConfiguration: sinon.stub().rejects(new Error('Service not available')),
      });
      const userVars = { var1: 'value1', var2: 'value2' };
      const selectedConfiguration = 'config1';

      await assert.rejects(
        deploymentService._retrieveUserVars(userVars, selectedConfiguration),
        new InvalidInputError(`Unable to retrieve provided saved configuration name: ${selectedConfiguration}`),
      );
    });
    it('should successfully update userVars with the retrieved configuration', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveWorkflowSavedConfiguration: sinon.stub().resolves({
          variables: {
            hosts: ['host1'],
            epn_enabled: 'true',
            odc_n_epns: '10',
          }
        }),
      });
      const userVars = { runType: 'RUN', hosts: ['host2'], epn_enabled: 'false', odc_n_epns: '5' };
      const selectedConfiguration = 'config1';

      const result = await deploymentService._retrieveUserVars(userVars, selectedConfiguration);

      assert.deepStrictEqual(result, {
        hosts: ['host2'],
        epn_enabled: 'false',
        odc_n_epns: '5',
      });
    });
  });

  describe(`'_buildUserVarsBasedOnSavedToIgnore' test suite`, async () => {
    it('should successfully build userVars based on configuration input', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });
      const userVars = {
        run_type: 'RUN',
        hosts: '["host2", "host1"]', epn_enabled: 'false', odc_n_epns: '5'
      };
      const workflowTemplate = 'template1';
      const expectedUserVars = {
        run_type: 'RUN',
        hosts: '["host2"]',
        epn_enabled: 'false',
        odc_n_epns: '5'
      };
      const result = await deploymentService._buildUserVarsBasedOnSavedToIgnore(userVars, workflowTemplate);
      assert.deepStrictEqual(result, expectedUserVars);
    });
    it('should throw an error if provided input does not contain workflowTemplate', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });

      await assert.rejects(
        deploymentService._buildUserVarsBasedOnSavedToIgnore({}, ''),
        new Error(`Unable to build userVars: Error: Missing mandatory parameter 'workflowTemplate' or 'vars'`)
      );
    });
    it('should throw an error if there are no hosts remained after ignoring', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });
      const userVars = {
        run_type: 'RUN',
        hosts: '["host1"]', epn_enabled: 'false', odc_n_epns: '5'
      };
      const workflowTemplate = 'template1';
      await assert.rejects(
        deploymentService._buildUserVarsBasedOnSavedToIgnore(userVars, workflowTemplate),
        new Error(`Unable to build userVars: Error: No hosts remained after ignoring the ones in Consul`)
      );
    });
    it('should throw an error if provided input does not contain vars', async () => {
      const deploymentService = new DeploymentService({}, {
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });

      await assert.rejects(
        deploymentService._buildUserVarsBasedOnSavedToIgnore({}, ''),
        new Error(`Unable to build userVars: Error: Missing mandatory parameter 'workflowTemplate' or 'vars'`)
      );
    });
  });

  describe(`'deployEnvironment' test suite`, async () => {
    it('should successfully deploy environment with valid input', async () => {
      const deploymentService = new DeploymentService({
        newEnvironmentAsync: sinon.stub().resolves({ id: 1 }),
      }, {
        retrieveWorkflowSavedConfiguration: sinon.stub().resolves({
          variables: {
            hosts: ['host1'],
            epn_enabled: 'true',
            odc_n_epns: '10',
          }
        }),
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });
      const userVars = { runType: 'RUN', hosts: '["host2", "host1"]', epn_enabled: 'false', odc_n_epns: '5' };
      const workflowTemplate = 'template1';
      const user = { name: 'user1' };

      const result = await deploymentService.deployEnvironment({ userVars, workflowTemplate, user });

      assert.deepStrictEqual(result, { id: 1 });
    });
    it('should throw an error if deployment fails', async () => {
      const deploymentService = new DeploymentService({
        newEnvironmentAsync: sinon.stub().rejects(new Error('Deployment failed')),
      }, {
        retrieveWorkflowSavedConfiguration: sinon.stub().resolves({
          variables: {
            hosts: ['host1'],
            epn_enabled: 'true',
            odc_n_epns: '10',
          }
        }),
        retrieveHostsToIgnore: sinon.stub().resolves(['host1']),
      });
      const userVars = { runType: 'RUN', hosts: '["host2", "host1"]', epn_enabled: 'false', odc_n_epns: '5' };
      const workflowTemplate = 'template1';
      const user = { name: 'user1' };

      await assert.rejects(
        deploymentService.deployEnvironment({ userVars, workflowTemplate, user }),
        new Error('Deployment failed')
      );
    });
  });
});
