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
const test = require('../mocha-index');

describe('`pageAbout` test-suite', async () => {
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
    calls['getFrameworkInfo'] = undefined;
  });

  it('should load', async () => {
    await page.goto(url + '?page=about', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(calls['getFrameworkInfo'], true);
    assert.strictEqual(location.search, '?page=about');
  });

  it('should request info about Control GUI and store in frameworkInfo RemoteData', async () => {
    const frameworkInfo = await page.evaluate(() => window.model.frameworkInfo.control.payload);
    assert.ok(frameworkInfo !== undefined);
    assert.ok(frameworkInfo['AliECS GUI'] !== undefined);
  });
});
