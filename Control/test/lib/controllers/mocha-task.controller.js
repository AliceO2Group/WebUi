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
const { TaskController } = require('../../../lib/controllers/Task.controller.js');
const { NotFoundError } = require('@aliceo2/web-ui');

describe(`'TaskController' test suite`, () => {
  let res;
  beforeEach(() => {
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  describe('getTaskListHandler', () => {
    it('should successfully return all tasks with status 200', async () => {
      const tasks = [{ id: '1' }, { id: '2' }];
      const mockedTaskService = {
        getTaskList: sinon.stub().resolves(tasks)
      };
      const controller = new TaskController(mockedTaskService);
      await controller.getTaskListHandler({}, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(tasks));
    });

    it('should handle errors and call error response', async () => {
      const error = new Error('Failed');
      const mockedTaskService = {
        getTaskList: sinon.stub().rejects(error),
      };
      const controller = new TaskController(mockedTaskService);
      await controller.getTaskListHandler({}, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({status: 500, title: 'Unknown Error', message: 'Failed'}));
    });
  });

  describe('getTaskHandler', () => {
    it('should return a task by id with status 200', async () => {
      const task = { id: 'abc' };
      const mockedTaskService = {
        getTaskById: sinon.stub().resolves(task)
      };
      const controller = new TaskController(mockedTaskService);
      await controller.getTaskHandler({ params: { id: 'abc' } }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(task));
    });

    it('should respond with error and 400 if id is missing', async () => {
      const mockedTaskService = {
        getTaskById: sinon.stub()
      };
      const controller = new TaskController(mockedTaskService);
      await controller.getTaskHandler({ params: {} }, res);
      assert.ok(res.status.calledWith(400));
      assert.ok(res.json.calledWith({status: 400, title: 'Invalid Input', message: 'Task ID is required'})); // error response
    });

    it('should handle errors from service', async () => {
      const error = new NotFoundError('Not found');
      const mockedTaskService = {
        getTaskById: sinon.stub().rejects(error)
      };
      const controller = new TaskController(mockedTaskService);
      await controller.getTaskHandler({ params: { id: 'abc' } }, res);
      assert.ok(res.status.calledWith(404));
      assert.ok(res.json.calledWith({status: 404, title: 'Not Found', message: 'Not found'}));
    });
  });

  describe('cleanUpTasksHandler', () => {
    it('should return killedTasks and runningTasks with status 200', async () => {
      const result = { killedTasks: [{ id: 'a' }], runningTasks: [{ id: 'b' }] };
      const mockedTaskService = {
        cleanUpTasks: sinon.stub().resolves(result)
      };
      const controller = new TaskController(mockedTaskService);
      await controller.cleanUpTasksHandler({ session: { username: 'tester' } }, res);
      assert.ok(res.status.calledWith(200));
      assert.ok(res.json.calledWith(result));
    });

    it('should handle errors from service', async () => {
      const error = new Error('Cleanup failed');
      const mockedTaskService = {
        cleanUpTasks: sinon.stub().rejects(error)
      };
      const controller = new TaskController(mockedTaskService);
      await controller.cleanUpTasksHandler({ session: { username: 'tester' } }, res);
      assert.ok(res.status.calledWith(500));
      assert.ok(res.json.calledWith({status: 500, title: 'Unknown Error', message: 'Cleanup failed'}));
    });
  });
});