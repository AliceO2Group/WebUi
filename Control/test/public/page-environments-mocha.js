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
      const location = await page.evaluate(() => window.location);

      assert.strictEqual(location.search, '?page=environments');
      assert.ok(calls['getEnvironments']);
    });

    it('should have a button in Action column for More Details', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > button', {timeout: 2000});
      const detailsButton = await page.evaluate(() => {
        const title = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div >button').title;
        const label = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > button').innerText;
        return {title, label};
      });
      assert.strictEqual(detailsButton.title, 'Open the environment page with more details');
      assert.strictEqual(detailsButton.label, 'Details');
    });

    it('should have a button in Action column for InfoLogger', async () => {
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > a', {timeout: 2000});
      const detailsButton = await page.evaluate(() => {
        const label = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > a').innerText;
        return {label};
      });
      assert.strictEqual(detailsButton.label, 'ILG');
    });

    it('should successfully navigate to environment page on click Details', async () => {
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > table > tbody > tr > td:nth-child(12) > div > button').click());
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

  describe('Verify create environment request', async () => {
    it('should diplsay failed environment request', async () => {
      await page.goto(url + '?page=newEnvironment');
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=newEnvironment');
      await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
      await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > a:nth-child(1)').click());
      await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > a:nth-child(2)').click());
      await page.waitForTimeout(200);
      await page.evaluate(() => document.querySelector('#create-env').click());
    });
  });
});
