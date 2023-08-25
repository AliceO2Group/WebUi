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
/* eslint-disable max-len */

const assert = require('assert');
const sinon = require('sinon');

const {WorkflowTemplateController} = require('../../../lib/controllers/WorkflowTemplate.controller.js');
const {NotFoundError} = require('../../../lib/errors/NotFoundError.js');

describe('WorkflowController test suite', () => {
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub()
  }

  describe(`'getDefaultTemplateSource' test suite`, async () => {
    it('should successfully build a response with workflow template info', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        getDefaultTemplateSource: sinon.stub().resolves({name: 'some-name', revision: 'some-revision', repository: 'some-repository'})
      });
      await workflowCtrl.getDefaultTemplateSource({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith({name: 'some-name', revision: 'some-revision', repository: 'some-repository'}));
    });

    it('should return 404 response as there was no default revision found', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        getDefaultTemplateSource: sinon.stub().rejects(new NotFoundError('No default revision identified'))
      });
      await workflowCtrl.getDefaultTemplateSource({}, res);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.json.calledWith({message: 'No default revision identified'}));
    });
  });

  describe(`'getWorkflowMapping' test suite`, async () => {
    it('should successfully return 200 with mappings array', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        retrieveWorkflowMappings: sinon.stub().resolves([{label: 'test', configuration: 'something'}])
      });
      await workflowCtrl.getWorkflowMapping({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith([{label: 'test', configuration: 'something'}]));
    });

    it('should successfully return 200 with empty array if nothing was found', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        retrieveWorkflowMappings: sinon.stub().resolves([])
      });
      await workflowCtrl.getWorkflowMapping({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith([]));
    });

    it('should return 404 response as there was no default revision found', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        retrieveWorkflowMappings: sinon.stub().rejects(new NotFoundError('No mappings found'))
      });
      await workflowCtrl.getWorkflowMapping({}, res);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.json.calledWith({message: 'No mappings found'}));
    });

    it('should return 502 response as there was specific error provided', async () => {
      const workflowCtrl = new WorkflowTemplateController({
        retrieveWorkflowMappings: sinon.stub().rejects(new Error('No mappings found'))
      });
      await workflowCtrl.getWorkflowMapping({}, res);
      assert.ok(res.status.calledWith(502));
      assert.ok(res.json.calledWith({message: 'No mappings found'}));
    });
  });
});
