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

describe('`pageHardware` test-suite', async () => {
  let url;
  let page;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
  });

  beforeEach(() => {
    // reset grpc calls
  });

  it('should load hardware page', async () => {
    await page.goto(url + '?page=hardware', {waitUntil: 'networkidle0'});
    await page.waitForTimeout(500);
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=hardware');
  });

  it('should successfully display detector panels', async () => {
    const panelTitles = await page.$$('.panel-title');
    const dcs = await(await panelTitles[0].getProperty('textContent')).jsonValue();
    const mid = await(await panelTitles[1].getProperty('textContent')).jsonValue();
    const odc = await(await panelTitles[2].getProperty('textContent')).jsonValue();
    assert.strictEqual(panelTitles.length, 3);
    assert.strictEqual(dcs, 'DCS (2)');
    assert.strictEqual(mid, 'MID (2)');
    assert.strictEqual(odc, 'ODC (2)');
  });

  it('should successfully display detector with flps panels', async () => {
    const panels = await page.$$('.panel');
    const dcs = await(await panels[0].getProperty('textContent')).jsonValue();
    const mid = await(await panels[1].getProperty('textContent')).jsonValue();
    const odc = await(await panels[2].getProperty('textContent')).jsonValue();
    assert.strictEqual(panels.length, 3);
    assert.strictEqual(dcs, 'ali-flp-22ali-flp-23');
    assert.strictEqual(mid, 'ali-flp-22ali-flp-23');
    assert.strictEqual(odc, 'ali-flp-22ali-flp-23');
  });
  
});
