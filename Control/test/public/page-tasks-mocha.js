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
const test = require('../mocha-index');

describe('`pageTaskList` test-suite', async () => {
  let url;
  let page;
  let calls;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  beforeEach(() => {
    // reset grpc calls
    calls['getTasks'] = undefined;
  });

  it('should successfully load task page', async () => {
    await page.goto(url + '?page=taskList', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(calls['getTasks'], true);
    assert.strictEqual(location.search, '?page=taskList');
  });

  it('should successfully add an input panel for searching tasks by name', async() => {
    const placeholder = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > input').placeholder);

    assert.strictEqual(placeholder, 'Search tasks by name');
  });

  it('should successfully update filter regex based on user\'s input', async() => {
    await page.type('input[id=searchTasksInput]', 'task-x', {delay: 20})
    const filterBy = await page.evaluate(() => window.model.task.filterBy.toString());
    assert.strictEqual(filterBy, '/.*task-x.*/')
  });

  it('should successfully refresh load tasks content after 5000ms', async () => {
    assert.strictEqual(calls['getTasks'], undefined);
    await page.waitForTimeout(5500);
    assert.strictEqual(calls['getTasks'], true);
  });
});
