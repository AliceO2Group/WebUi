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

const { strictEqual } = require('assert');
const { ShortTaskInfoAdapter } = require('../../../lib/adapters/ShortTaskInfoAdapter');
const { TaskState } = require('../../../lib/common/taskState.enum.js');

describe('ShortTaskInfoAdapter test suite', () => {
  describe('_getShortName() - tests', async () => {
    it('should successfully replace task name if regex is matched', async () => {
      const tagModified = ShortTaskInfoAdapter._getShortName('github.com/AliceO2Group/ControlWorkflows/tasks/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
      strictEqual(tagModified, 'readout');
    });

    it('should not replace task name due to regex not matching the name (missing tasks/ group)', async () => {
      const nameNotModified = ShortTaskInfoAdapter._getShortName('github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
      strictEqual(nameNotModified, 'github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
    });

    it('should not replace task name due to regex not matching the name (missing @ character)', async () => {
      const taskFullName = 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a';
      const nameNotModified = ShortTaskInfoAdapter._getShortName(taskFullName);
      strictEqual(nameNotModified, taskFullName);
    });
  });

  describe('toEntity() - tests', () => {
    it('should map all fields correctly from a typical task object', function () {
      const task = {
        name: 'tasks/MyTask@host',
        locked: true,
        taskId: 42,
        status: 'RUNNING',
        state: TaskState.RUNNING,
        className: 'SomeClass',
        deploymentInfo: { hostname: 'host' },
        pid: 1234,
        sandboxStdout: '/tmp/stdout',
        critical: true
      };
      const entity = ShortTaskInfoAdapter.toEntity(task);
      strictEqual(entity.id, 42);
      strictEqual(entity.taskId, 42);
      strictEqual(entity.name, 'MyTask');
      strictEqual(entity.locked, true);
      strictEqual(entity.hostname, 'host');
      strictEqual(entity.status, 'RUNNING');
      strictEqual(entity.state, TaskState.RUNNING);
      strictEqual(entity.className, 'SomeClass');
      strictEqual(entity.pid, 1234);
      strictEqual(entity.sandboxStdout, '/tmp/stdout');
      strictEqual(entity.isCritical, true);
    });

    it('should default missing fields', function () {
      const task = {
        name: 'tasks/OtherTask@host',
        locked: false,
        taskId: 7,
        deploymentInfo: undefined,
        pid: undefined,
        sandboxStdout: undefined
      };
      const entity = ShortTaskInfoAdapter.toEntity(task);
      strictEqual(entity.status, 'UNKNOWN');
      strictEqual(entity.state, TaskState.UNKNOWN);
      strictEqual(entity.hostname, '');
      strictEqual(entity.isCritical, false);
    });

    it('should set state to ERROR_CRITICAL if state is ERROR and critical is true', function () {
      const task = {
        name: 'tasks/FailTask@host',
        locked: false,
        taskId: 99,
        state: TaskState.ERROR,
        critical: true
      };
      const entity = ShortTaskInfoAdapter.toEntity(task);
      strictEqual(entity.state, TaskState.ERROR_CRITICAL);
    });

    it('should not set state to ERROR_CRITICAL if state is ERROR and critical is false', function () {
      const task = {
        name: 'tasks/FailTask@host',
        locked: false,
        taskId: 99,
        state: TaskState.ERROR,
        critical: false
      };
      const entity = ShortTaskInfoAdapter.toEntity(task);
      strictEqual(entity.state, TaskState.ERROR);
    });
  });
});
