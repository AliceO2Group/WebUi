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
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=locks');
  });

  it('verify detector column', async () => {
    await page.waitForSelector('.table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(1) > div', {timeout: 1000});
    const mid = await page.evaluate(() => document.querySelector('.table > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(1) > div').innerText);
    assert.strictEqual(mid, 'MID');
  });

  it('take ownership of lock by pressing lock icon button', async () => {
    await page.locator('button#detectorLockButtonForODC')
      .setTimeout(500)
      .click();

    await page.waitForFunction(() => window.model.lock.isLockedByCurrentUser('ODC'), {timeout: 5000});

    const owner = await page.locator('#detector-row-ODC > td:nth-child(2)')
      .setTimeout(500)
      .map((element) => element.innerText)
      .wait();
    assert.strictEqual(owner, 'Anonymous');
  });

  // it('force unlock detector', async () => {
  //   await page.waitForSelector('table > tbody:nth-child(2) > tr:nth-child(3) > td:nth-child(2) > button:nth-child(1)'); 
  //   await page.evaluate(() =>  document.querySelector('.table > tbody:nth-child(2) > tr:nth-child(3) > td:nth-child(2) > button:nth-child(1)').click());
  //   const isLocked = await page.evaluate(() => window.model.lock.isLockedByCurrentUser('ODC'));
  //   assert.ok(!isLocked);
  // });
});
