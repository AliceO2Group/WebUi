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
const TaskInfoAdapter = require('../../../lib/adapters/TaskInfoAdapter');

describe('TaskInfoAdapter test suite', () => {
  describe('getShortName() - tests', async () => {
    it('should successfully replace task name if regex is matched', async () => {
      const tagModified = TaskInfoAdapter.getShortName('github.com/AliceO2Group/ControlWorkflows/tasks/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
      assert.strictEqual(tagModified, 'readout');
    });

    it('should not replace task name due to regex not matching the name (missing tasks/ group)', async () => {
      const nameNotModified = TaskInfoAdapter.getShortName('github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
      assert.strictEqual(nameNotModified, 'github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
    });

    it('should not replace task name due to regex not matching the name (missing @ character)', async () => {
      const taskFullName = 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a';
      const nameNotModified = TaskInfoAdapter.getShortName(taskFullName);
      assert.strictEqual(nameNotModified, taskFullName);
    });
  });
});
