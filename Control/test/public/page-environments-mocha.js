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

describe('`pageEnvironments` test-suite', () => {
  let url;
  let page;
  let calls;

  before(() => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  beforeEach(() => {
    calls['getEnvironments'] = undefined;
    calls['destroyEnvironment'] = undefined;
  });

  describe('Check transition to particular environment works', async () => {
    it('should successfully load page and request data', async () => {
      await page.goto(url + '?page=environments', {waitUntil: 'networkidle0'});

      await page.waitForTimeout(500);
      const location = await page.evaluate(() => window.location);

      assert.strictEqual(location.search, '?page=environments');
      assert.ok(calls['getEnvironments']);
    });

    it('should have a button in Action column for InfoLogger', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > a', {timeout: 2000});
      const detailsButton = await page.evaluate(() => {
        const label = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > a').innerText;
        return {label};
      });
      assert.strictEqual(detailsButton.label, 'FLP');
    });

    it('should successfully navigate to environment page when clicking on environment ID', async () => {
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(2) > a').click());
      await page.waitForTimeout(200);
      assert.ok(calls['getEnvironment']);
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220');
    });
  });

  describe('Check transition to particular environment works', async () => {
    it('should successfully load page', async () => {
      await page.goto(url + '?page=environments', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=environments');
    });
  });

  describe('Test new environment request', async () => {
    it('create failed environment request', async () => {
      await page.goto(url + '?page=newEnvironment');
      const location = await page.evaluate(() => window.location);
      assert.ok(location.search === '?page=newEnvironment');
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
      await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > a:nth-child(1)').click());
      await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > a:nth-child(2)').click());
      await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('#create-env').click());
    });

    it('verify request fields', async () => {
      await waitForEnvRequest(page);
      const detector = await page.evaluate(() => document.querySelector('body > div.flex-column.absolute-fill > div.flex-grow.flex-row > div.flex-grow.relative > div > table > tbody > tr > td:nth-child(2)').innerText);
      const state = await page.evaluate(() => document.querySelector('body > div.flex-column.absolute-fill > div.flex-grow.flex-row > div.flex-grow.relative > div > table > tbody > tr > td:nth-child(6)').innerText);
      assert.strictEqual(detector, 'MID');
      assert.strictEqual(state, 'FAILED');
    });
  });
});

/**
 * Wait for response create env request to fail
 * @param {Object} page
 * @param {number} timeout
 * @return {Promise}
 */
async function waitForEnvRequest(page, timeout = 90) {
  return new Promise(async (resolve) => {
    let i = 0;
    while (i++ < timeout) {
      const requestFailed = await page.evaluate(() => window.model?.environment?.requests?.payload?.requests[0]?.failed);
      if (requestFailed) {
        await page.waitForTimeout(1000);
        resolve();
      } else {
        await page.waitForTimeout(1000);
      }
    }
  });
}
