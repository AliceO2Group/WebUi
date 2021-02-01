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

describe('Filter actions test-suite', async () => {
  let baseUrl;
  let page;

  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
  });

  describe('LogFilter', async () => {
    it('should succesfully load a page with profile in the URI', async function() {
      await page.goto(baseUrl + "?profile=physicist", {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      const search = decodeURIComponent(location.search);

      // for now, check if redirected to default page
      assert.deepStrictEqual(search, '?q={"severity":{"in":"I W E F"}}');
    });

    it('should update column headers based on profile when passed in the URI', async () => {
      const expectedColumns = {
        date: {size: 'cell-m', visible: false},
        time: {size: 'cell-m', visible: true},
        hostname: {size: 'cell-m', visible: false},
        rolename: {size: 'cell-m', visible: true},
        pid: {size: 'cell-s', visible: false},
        username: {size: 'cell-m', visible: false},
        system: {size: 'cell-s', visible: true},
        facility: {size: 'cell-m', visible: true},
        detector: {size: 'cell-s', visible: false},
        partition: {size: 'cell-m', visible: false},
        run: {size: 'cell-s', visible: false},
        errcode: {size: 'cell-s', visible: true},
        errline: {size: 'cell-s', visible: false},
        errsource: {size: 'cell-m', visible: false},
        message: {size: 'cell-xl', visible: true}
      };

      const columns = await page.evaluate(() => {
        return window.model.table.colsHeader;
      });

      assert.deepStrictEqual(columns, expectedColumns);
    });

    it('should update filters based on profile when passed in the URI', async () => {
      // for now check if the filters are reset once the profile is passed 
      const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
   
      const searchParams = await page.evaluate(() => {
        const params = {profile:'physicist'};
        window.model.parseLocation(params);
        return window.location.search;
      });

      await page.waitForFunction(`window.model.notification.state === 'shown'`);
      await page.waitForFunction(`window.model.notification.type === 'success'`);
      await page.waitForFunction(`window.model.notification.message === "The profile PHYSICIST was loaded successfully"`);

      assert.strictEqual(searchParams, expectedParams);
    });

    it('should reset filters and show warning message when profile and filters are passed', async () => {
      // wait until the previous notification is hidden
      await page.waitForFunction(`window.model.notification.state === 'hidden'`);
      const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
      const searchParams = await page.evaluate(() => {
        const params ={profile: "physicist", q: '"severity":{"in":"I W E F"}}'};
        window.model.parseLocation(params);
        return window.location.search;
      });

      await page.waitForFunction(`window.model.notification.state === 'shown'`);
      await page.waitForFunction(`window.model.notification.type === 'warning'`);
      await page.waitForFunction(`window.model.notification.message === "URL can contain only filters or profile, not both"`);
      assert.strictEqual(searchParams, expectedParams);
    });

    it('should update URI with new encoded criteria', async () => {
      /* eslint-disable max-len */
      const decodedParams = '?q={"hostname":{"match":"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
      const expectedParams = '?q={%22hostname%22:{%22match%22:%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
      /* eslint-enable max-len */
      const searchParams = await page.evaluate(() => {
        window.model.log.filter.setCriteria('hostname', 'match', '%ald_qdip01%');
        window.model.updateRouteOnModelChange();
        return window.location.search;
      });

      assert.deepStrictEqual(searchParams, expectedParams);
      assert.deepStrictEqual(decodeURI(searchParams), decodedParams);
    });

    it('should parse dates in format DD/MM/YY', async () => {
      // default Geneva time
      const $since = await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04');
        return window.model.log.filter.criterias.timestamp.$since.toISOString();
      });

      assert.deepStrictEqual($since, '2004-01-31T23:00:00.000Z');
    });

    it('should parse dates in format DD/MM/YYTHH:MM', async () => {
      // default Geneva time
      const $since = await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04T00:00');
        return window.model.log.filter.criterias.timestamp.$since.toISOString();
      });

      assert.deepStrictEqual($since, '2004-01-31T23:00:00.000Z');
    });

    it('should parse numbers to integers', async () => {
      const level = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', 12);
        return window.model.log.filter.criterias.level;
      });

      assert.deepStrictEqual(level.$max, 12);
      assert.deepStrictEqual(level.max, 12);
    });

    it('should parse empty keyword to null', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '');
        return window.model.log.filter.criterias.pid.$match;
      });

      assert.deepStrictEqual($match, null);
    });

    it('should parse keyword', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '1234');
        return window.model.log.filter.criterias.pid.$match;
      });

      assert.deepStrictEqual($match, '1234');
    });

    it('should parse no keywords to null', async () => {
      const $in = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'in', '');
        return window.model.log.filter.criterias.pid.$in;
      });

      assert.deepStrictEqual($in, null);
    });

    it('should parse keywords to array', async () => {
      const $in = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'in', '123 456');
        return window.model.log.filter.criterias.pid.$in;
      });

      assert.deepStrictEqual($in.length, 2);
      assert.deepStrictEqual($in, ['123', '456']);
    });

    it('should reset filters and set them again', async () => {
      const criterias = await page.evaluate(() => {
        window.model.log.filter.resetCriterias();
        window.model.log.filter.setCriteria('level', 'max', 21);
        return window.model.log.filter.criterias;
      });

      assert.deepStrictEqual(criterias.pid.match, '');
      assert.deepStrictEqual(criterias.pid.$match, null);
      assert.deepStrictEqual(criterias.level.max, 21);
      assert.deepStrictEqual(criterias.level.$max, 21);
      assert.deepStrictEqual(criterias.timestamp.since, '');
      assert.deepStrictEqual(criterias.timestamp.$since, null);
      assert.deepStrictEqual(criterias.severity.in, 'I W E F');
      assert.deepStrictEqual(criterias.severity.$in, ['W', 'I', 'E', 'F']);
    });

  });
});
