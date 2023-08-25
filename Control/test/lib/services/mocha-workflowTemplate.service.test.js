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

const {WorkflowTemplateService} = require('../../../lib/services/WorkflowTemplate.service.js');
const {NotFoundError} = require('../../../lib/errors/NotFoundError.js');

const mockRepoList = [
  {
    revisions: ['master', 'dev'],
    name: 'non-optimal-workflow',
    defaultRevision: 'flp-suite-bad',
  },
  {
    revisions: ['master', 'dev'],
    name: 'optimal-workflow',
    default: true,
    defaultRevision: 'flp-suite',
  }
];

describe('WorkflowTemplateService test suite', () => {

  describe(`'getDefaultTemplateSource' test suite`, async () => {
    it('should successfully build a response with default workflow template information', async () => {
      const stub = sinon.stub().resolves({repos: mockRepoList});
      const workflowTemplate = new WorkflowTemplateService({ListRepos: stub});
      const templateInfo = await workflowTemplate.getDefaultTemplateSource();
      assert.deepStrictEqual(templateInfo, {
        repository: 'optimal-workflow',
        revision: 'flp-suite',
        name: 'readout-dataflow'
      });
    });

    it('should throw error due to no default repository being identified', async () => {
      const stub = sinon.stub().resolves({repos: [mockRepoList[0]]}); // first element has no default
      const workflowTemplate = new WorkflowTemplateService({ListRepos: stub});
      await assert.rejects(() => workflowTemplate.getDefaultTemplateSource(), new NotFoundError('Unable to find a default repository'));
    });

    it('should throw error due to no default revision being identified', async () => {
      const stub = sinon.stub().resolves({repos: [  {
        revisions: ['master', 'dev'],
        name: 'optimal-workflow',
        default: true,
      }]});
      const workflowTemplate = new WorkflowTemplateService({ListRepos: stub});
      await assert.rejects(() => workflowTemplate.getDefaultTemplateSource(), new NotFoundError('Unable to find a default revision'));
    });
  });

  describe(`'retrieveWorkflowMappings' test suite`, async () => {
    it('should successfully return mappings array', async () => {
      const getRuntimeEntryByComponent = sinon.stub().resolves(
        JSON.stringify([{label: 'config1', component: 'Config_1'}])
      );
      const workflowTemplate = new WorkflowTemplateService({}, {getRuntimeEntryByComponent});
      const mappings = await workflowTemplate.retrieveWorkflowMappings();
      assert.deepStrictEqual(mappings, [{label: 'config1', component: 'Config_1'}]);
    });

    it('should successfully return empty array if Apricot returned empty object', async () => {
      const getRuntimeEntryByComponent = sinon.stub().resolves(
        JSON.stringify('{}')
      );
      const workflowTemplate = new WorkflowTemplateService({}, {getRuntimeEntryByComponent});
      const mappings = await workflowTemplate.retrieveWorkflowMappings();
      assert.deepStrictEqual(mappings, []);
    });

    it('should throw NotFoundError due to apricot service throwing gRPC code 5', async () => {
      const getRuntimeEntryByComponent = sinon.stub().rejects({code: 5, details: 'Could not be found'});
      const workflowTemplate = new WorkflowTemplateService({}, {getRuntimeEntryByComponent});
      await assert.rejects(() => workflowTemplate.retrieveWorkflowMappings(), new NotFoundError('Could not be found'));
    });

    it('should throw general native error due to code being present', async () => {
      const getRuntimeEntryByComponent = sinon.stub().rejects({noCode: 'noCode'});
      const workflowTemplate = new WorkflowTemplateService({}, {getRuntimeEntryByComponent});
      await assert.rejects(() => workflowTemplate.retrieveWorkflowMappings(), new Error());
    });
  });

  describe(`'retrieveWorkflowSavedConfiguration' test suite`, async () => {
    it('should successfully return workflow content parsed as JSON', async () => {
      const getRuntimeEntryByComponent = sinon.stub().resolves(
        JSON.stringify({name: 'some config', detectors: ['TPC', 'FSA']})
      );
      const workflowTemplate = new WorkflowTemplateService({}, {getRuntimeEntryByComponent});
      const mappings = await workflowTemplate.retrieveWorkflowSavedConfiguration();
      assert.deepStrictEqual(mappings, {name: 'some config', detectors: ['TPC', 'FSA']});
    });
  });
});
