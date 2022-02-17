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
const {JwtToken} = require('@aliceo2/web-ui');

const test = require('../mocha-index');

describe('User Profile test-suite', async () => {
  let baseUrl;
  let page;
  let jwt, testToken;

  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
    jwt = new JwtToken(test.helpers.jwt);
    testToken = jwt.generateToken(1, 'test', 'admin');
  });

  describe('User is anonymous', async () => {
    it('should have a button in action dropdown button to view info about the framework', async () => {
      const profileMenuItem = await page.evaluate(() => {
        const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').title;
        const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').innerText;
        return {title: title, text: text};
      });
      assert.strictEqual(profileMenuItem.title, 'Show/Hide details about the framework');
      assert.strictEqual(profileMenuItem.text, 'About');
    });

    it('should not have a button in action dropdown button to save the profile', async () => {
      const profileMenuItem = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)'));
      assert.strictEqual(profileMenuItem, null);
    });
  });

  describe('User is NOT anonymous', async () => {
    it('should have a button in action dropdown button to save user profile', async () => {
      await page.goto(baseUrl + `?personid=1&name=test&token=${testToken}`, {waitUntil: 'networkidle0'});
      const profileMenuItem = await page.evaluate(() => {
        const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').title;
        const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').innerText;
        return {title: title, text: text};
      });
      assert.strictEqual(profileMenuItem.title, 'Save the columns size and visibility as your profile');
      assert.strictEqual(profileMenuItem.text, 'Save Profile');
    });

    it('successfully save the profile of the user when pressed the "Save Profile" menu-item', async () => {
      await page.evaluate(() => {
        document.querySelector('body > div:nth-child(2) > div > header:nth-child(2) > table > tbody > tr > td > button').click();
        document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').click();
      });
      await page.waitForTimeout(200);

      const actionDropdownClosed = await page.evaluate(() => window.model.accountMenuEnabled);
      assert.ok(!actionDropdownClosed);
    });

    it('should have a button in action dropdown button to view info about the framework', async () => {
      const profileMenuItem = await page.evaluate(() => {
        const title = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').title;
        const text = document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(2)').innerText;
        return {title: title, text: text};
      });
      assert.strictEqual(profileMenuItem.title, 'Show/Hide details about the framework');
      assert.strictEqual(profileMenuItem.text, 'About');
    });

    it('should successfully load profile saved for user when accessing the page', async () => {
      await page.goto(baseUrl + `?personid=1&name=test&token=${testToken}`, {waitUntil: 'networkidle0'});
      const userProfile = await page.evaluate(() => {
        window.model.table.colsHeader.date.size = 'cell-xl';
        document.querySelector('body > div:nth-child(2) > div > header:nth-child(2) > table > tbody > tr > td > button').click();
        document.querySelector('body > div:nth-child(2) > div > header > div > div > div > div:nth-child(3)').click();
        return window.model.userProfile;
      });
      page.waitForTimeout(200);
      assert.ok(!userProfile.payload.content.colsHeader.date.visible);
    });
  });
});
