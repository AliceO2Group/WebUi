/**
 *  @license
 *  Copyright CERN and copyright holders of ALICE O2. This software is
 *  distributed under the terms of the GNU General Public License v3 (GPL
 *  Version 3), copied verbatim in the file "COPYING".
 *
 *  See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 *  In applying this license CERN does not waive the privileges and immunities
 *  granted to it by virtue of its status as an Intergovernmental Organization
 *  or submit itself to any jurisdiction.
 */

const assert = require('assert');
const { taskEventAdapter } = require('./../../../../lib/kafka/adapters/taskEventAdapter.js');
const { TaskState } = require('./../../../../lib/common/taskState.enum.js');
const { TaskStatus } = require('./../../../../lib/common/taskStatus.enum.js');

describe(`'taskEventAdapter' - test suite`, () => {
  it('should successfully adapt a task event message', () => {
    const input = {
      taskEvent: {
        name: 'ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8',
        taskid: 42,
        state: TaskState.RUNNING,
        status: TaskStatus.ACTIVE,
        hostname: 'host1',
        className: 'SomeClass',
        traits: { critical: true },
        environmentId: 'env1'
      }
    };
    const result = taskEventAdapter(input);
    assert.strictEqual(result.id, 42);
    assert.strictEqual(result.taskId, 42);
    assert.strictEqual(result.name, 'readout');
    assert.strictEqual(result.hostname, 'host1');
    assert.strictEqual(result.status, TaskStatus.ACTIVE);
    assert.strictEqual(result.state, TaskState.RUNNING);
    assert.strictEqual(result.className, 'SomeClass');
    assert.strictEqual(result.isCritical, true);
    assert.strictEqual(result.environmentId, 'env1');
  });

  it('should successfully set state to ERROR_CRITICAL if state is ERROR and critical is true', function () {
    const input = {
      taskEvent: {
        name: 'ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8',
        taskid: 99,
        state: TaskState.ERROR,
        status: TaskStatus.UNDEFINED,
        hostname: 'host2',
        className: 'ErrClass',
        traits: { critical: true },
        environmentId: 'env2'
      }
    };
    const result = taskEventAdapter(input);
    assert.strictEqual(result.state, TaskState.ERROR_CRITICAL);
  });

  it('should NOT set state to ERROR_CRITICAL if state is ERROR and isCritical is false', function () {
    const input = {
      taskEvent: {
        name: 'ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8',
        taskid: 100,
        state: TaskState.ERROR,
        status: TaskStatus.UNDEFINED,
        hostname: 'host2',
        className: 'ErrClass',
        traits: { critical: false },
        environmentId: 'env2'
      }
    };
    const result = taskEventAdapter(input);
    assert.strictEqual(result.state, TaskState.ERROR);
  });

  it(`should successfully add defaults for 'state', 'status' and 'critical' if attributes are missing`, function () {
    const input = {
      taskEvent: {
        name: 'ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8',
        taskid: 1,
        traits: {},
        environmentId: 'env3'
      }
    };
    const result = taskEventAdapter(input);
    assert.strictEqual(result.state, TaskState.UNKNOWN);
    assert.strictEqual(result.status, TaskStatus.UNDEFINED);
    assert.strictEqual(result.isCritical, false);
  });

  it(`should successfully handle missing traits object gracefully and set 'isCritical' to false`, function () {
    const input = {
      taskEvent: {
        name: 'ControlWorkflows/tasks/readout@0265561fc84a60307a28b68700afb617c23ee753#2t3dVbgcVS8',
        taskid: 3,
        environmentId: 'env5'
      }
    };
    // Should not throw
    assert.doesNotThrow(() => taskEventAdapter(input));
    const result = taskEventAdapter(input);
    assert.strictEqual(result.isCritical, false);
  });

  it(`should successfully handle missing 'name' attribute`, function () {
    const input = {
      taskEvent: {
        taskid: 4,
        traits: {},
        environmentId: 'env6'
      }
    };
    const result = taskEventAdapter(input);
    assert.strictEqual(result.name, '');
  });
});
