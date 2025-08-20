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
const {NotFoundError} = require('@aliceo2/web-ui');

const {TaskService} = require('../../../lib/services/Task.service.js');
const {ShortTaskInfoAdapter} = require('../../../lib/adapters/task/ShortTaskInfoAdapter.js');

describe(`'TaskService' test suite`, () => {
  describe('getTaskById', () => {
    it('should return a task when grpcClient resolves', async () => {
      const mockedTask = { taskId: 't1', name: 'TestTask' };
      const grpcClient = {
        GetTask: sinon.stub().resolves({ task: mockedTask })
      };
      const service = new TaskService(grpcClient);
      const result = await service.getTaskById('t1');

      assert.deepStrictEqual(result, mockedTask);
      assert.ok(grpcClient.GetTask.calledWith({ taskId: 't1' }));
    });

    it('should throw native error when grpcClient rejects', async () => {
      const grpcError = {
        code: 5,
        details: 'not found'
      };
      const grpcClient = {
        GetTask: sinon.stub().rejects(grpcError)
      };
      const service = new TaskService(grpcClient);
      service._logger = { errorMessage: sinon.stub() };
      await assert.rejects(service.getTaskById('t1'), new NotFoundError('not found'));
    });
  });

  describe('getTaskList', () => {
    it('should return tasks when grpcClient resolves', async () => {
      const mockedTaskList = [{ taskId: 't1', name: 'TestTask1' }, { taskId: 't2', name: 'TestTask2' }];
      const grpcClient = {
        GetTasks: sinon.stub().resolves({ tasks: mockedTaskList })
      };
      const service = new TaskService(grpcClient);
      const result = await service.getTaskList();
      assert.deepStrictEqual(result, mockedTaskList.map((task) => ShortTaskInfoAdapter.toEntity(task)));
      assert.ok(grpcClient.GetTasks.calledOnce);
    });

    it('should throw native error when grpcClient rejects', async () => {
      const grpcError = {
        code: 5,
        details: 'not found'
      };
      const grpcClient = {
        GetTasks: sinon.stub().rejects(grpcError)
      };
      const service = new TaskService(grpcClient);
      await assert.rejects(service.getTaskList(), new NotFoundError('not found'));
    });
  });

  describe('cleanUpTasks', () => {
    it('should return killedTasks and runningTasks when grpcClient resolves', async () => {
      const grpcClient = {
        CleanUpTasks: sinon.stub().resolves({ killedTasks: [{ taskId: 't1' }], runningTasks: [{ taskId: 't2' }] })
      };
      const service = new TaskService(grpcClient);
      const result = await service.cleanUpTasks();
      assert.deepStrictEqual(result, {
        killedTasks: [{ taskId: 't1' }].map((task) => ShortTaskInfoAdapter.toEntity(task)),
        runningTasks: [{ taskId: 't2' }].map((task) => ShortTaskInfoAdapter.toEntity(task)),
      });
      assert.ok(grpcClient.CleanUpTasks.calledOnce);
    });

    it('should throw native error when grpcClient rejects', async () => {
      const grpcError = {
        code: 5,
        details: 'not found'
      };
      const grpcClient = {
        CleanUpTasks: sinon.stub().rejects(grpcError)
      };
      const service = new TaskService(grpcClient);
      await assert.rejects(service.cleanUpTasks(), new NotFoundError('not found'));
    });
  });
});
