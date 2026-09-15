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

    const roundTripTestCases = [
      // /["]+/g collapsed a run of quotes into a single escaped one, so "" came back as "
      { name: 'consecutive double quotes', value: 'a""b' },
      // C:\temp used to reach JSON.parse unescaped and come back as C:<tab>emp
      { name: 'a backslash forming valid JSON escape', value: 'C:\\temp' },
      // C:\xyz used to throw, resetting every filter
      { name: 'a backslash not forming valid JSON escape', value: 'C:\\xyz' },
      { name: 'a multi-line message', value: 'first\nsecond' },
      { name: 'URL-significant characters', value: 'a&b#c=d?e %20 a+b c %d #anchor & = héllo wörld 日本語' },
    ];

    roundTripTestCases.forEach(({ name, value }) => {
      it(`should preserve ${name}`, async () => {
        assert.strictEqual(await roundTrip(value), value);
      });
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
