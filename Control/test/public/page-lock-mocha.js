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

describe('`pageLock` test-suite', async () => {
  let url;
  let page;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
  });

  it('should load locks page', async () => {
    await page.goto(url + '?page=locks', {waitUntil: 'networkidle0'});
    await page.waitForTimeout(500);
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=locks');
  });

  it('verify detector column', async () => {
    await page.waitForSelector('.table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(1)', {timeout: 1000});
    const mid = await page.evaluate(() => document.querySelector('.table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(1)').innerText);
    assert.strictEqual(mid, 'MID');
  });

  it('lock detector', async () => {
    await page.evaluate(() => document.querySelector('.table > tbody:nth-child(2) > tr:nth-child(3) > td:nth-child(2) > button:nth-child(1)').click());
    await page.waitForTimeout(500);

    let isLocked = await page.evaluate(() => window.model.lock.isLockedByMe('ODC'));
    assert.ok(isLocked);

    const owner = await page.evaluate(() => document.querySelector('.table > tbody:nth-child(2) > tr:nth-child(3) > td:nth-child(3)').innerText);
    assert.strictEqual(owner, 'Anonymous');
  });

  it('force unlock detector', async () => {
    await page.waitForSelector('button.danger');
    await page.evaluate(() =>  document.querySelector('button.danger').click());
    isLocked = await page.evaluate(() => window.model.lock.isLockedByMe('ODC'));
    assert.ok(!isLocked);
  });
});
