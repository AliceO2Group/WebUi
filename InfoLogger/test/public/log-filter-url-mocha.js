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

describe('URL Encoding/Decoding Suite', async () => {
  let page = null;

  before(async () => {
    ({ page } = test);
    await page.goto(test.helpers.baseUrl, { waitUntil: 'networkidle0' });
  });

  describe('Filter round-trip through the URL', async () => {
    /**
     * Sets message match criteria, then reloads the page on the URL the model produced for it
     * @param {string} value - the raw filter value to round-trip
     * @returns {Promise<string>} the value held by the model after the reload
     */
    const roundTrip = async (value) => {
      const url = await page.evaluate((raw) => {
        window.model.log.filter.setCriteria('message', 'match', raw);
        window.model.updateRouteOnModelChange();
        return window.location.href;
      }, value);

      await page.goto(url, { waitUntil: 'networkidle0' });
      return await page.evaluate(() => window.model.log.filter.criterias.message.match);
    };

    it('should preserve consecutive double quotes', async () => {
    // /["]+/g collapsed a run of quotes into a single escaped one, so "" came back as "
      const stringToTest = 'a""b';
      assert.strictEqual(await roundTrip(stringToTest), stringToTest);
    });

    it('should preserve a backslash that forms a valid JSON escape', async () => {
    // C:\temp used to reach JSON.parse unescaped and come back as C:<tab>emp
      const stringToTest = 'C:\\temp';
      assert.strictEqual(await roundTrip(stringToTest), stringToTest);
    });

    it('should preserve a backslash that does not form a valid JSON escape', async () => {
    // C:\xyz used to throw, resetting every filter
      const stringToTest = 'C:\\xyz';
      assert.strictEqual(await roundTrip(stringToTest), stringToTest);
    });

    it('should preserve a multi-line message filter', async () => {
      const stringToTest = 'first\nsecond';
      assert.strictEqual(await roundTrip(stringToTest), stringToTest);
    });

    it('should preserve a value containing URL-significant characters', async () => {
      const stringToTest = 'a&b#c=d?e %20 a+b c %d #anchor & = héllo wörld 日本語';
      assert.strictEqual(await roundTrip(stringToTest), stringToTest);
    });

    it('should store the value unencoded in the model', async () => {
      const stringToTest = 'a&b#c=d?e %20 a+b c %d #anchor & = héllo wörld 日本語';
      const stored = await page.evaluate((stringToTest) => {
        window.model.log.filter.setCriteria('message', 'match', stringToTest);
        return window.model.log.filter.toObject().message.match;
      }, stringToTest);

      assert.strictEqual(stored, stringToTest);
    });
  });
});
