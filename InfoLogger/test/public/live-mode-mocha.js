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
const {createServer, closeServer} = require('../live-simulator/infoLoggerServer.js');

describe('Live Mode test-suite', async () => {
  let baseUrl;
  let page;
  let ilgServer;
  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
    // Start infologgerserver simulator
    ilgServer = createServer();
    await page.waitForTimeout(5000);
  });

  after(async () => {
    closeServer(ilgServer);
    await page.waitForTimeout(5000);
  });

  it('should go to homepage', async function() {
    await page.goto(baseUrl, {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);

    assert.deepStrictEqual(search, '?q={"severity":{"in":"I W E F"}}');
  });

  it('should successfully enable LIVE mode', async () => {
    const activeMode = await page.evaluate(() => {
      window.model.log.liveStart();
      return window.model.log.activeMode;
    });

    assert.strictEqual(activeMode, 'Running');
  });

  it('should have filled some logs via WS with the level "debug"', async () => {
    // check level is still 21 after LogFilter tests
    const criterias = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('level', 'max', 21);
      return window.model.log.filter.criterias;
    });

    assert.strictEqual(criterias.level.max, 21);
    assert.strictEqual(criterias.level.$max, 21);

    // Wait for logs and count them (2-3 maybe, it's random)
    await page.waitForTimeout(1500); // simulator is set to ~100ms per log
    const list = await page.evaluate(() => {
      return window.model.log.list;
    });
    assert.ok(!!list.length);
  });

  it('should filter messages based on `hostname` matching `aldaqecs01-v1` from live -> paused -> live', async () => {
    await page.evaluate(() => window.model.log.liveStop('Paused'));
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('hostname', 'match', 'aldaqecs01-v1');
    });
    await page.evaluate(() => window.model.log.liveStart());
    await page.waitForTimeout(7000);
    const list = await page.evaluate(() => window.model.log.list);
    await page.waitForTimeout(1000);
    const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => hostname === 'aldaqecs01-v1');
    assert.ok(list.length > 0);
    assert.ok(isHostNameMatching);
  });

  it('should filter messages based on `hostname` excluding `aldaqdip01` from live -> query -> live', async () => {
    await page.evaluate(() => window.model.log.liveStop('Query'));
    await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('hostname', 'exclude', 'aldaqdip01');
    });
    await page.evaluate(() => window.model.log.liveStart());
    await page.waitForTimeout(3000);
    const list = await page.evaluate(() => window.model.log.list);
    const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => hostname !== 'aldaqdip01');

    assert.ok(list.length > 0);
    assert.ok(isHostNameMatching);
  });

  it('should filter messages based on SQL Wildcards `hostname` excluding `%ldaqdip%` and username matching `a_iceda_` without changing state of live mode', async () => {
    await page.evaluate(() => window.model.log.filter.resetCriteria());
    await page.evaluate(() => {
      window.model.log.setCriteria('hostname', 'exclude', '%ldaqdip%');
      window.model.log.setCriteria('username', 'match', 'a_iceda_');
      window.model.log.empty();
    });
    await page.waitForTimeout(3000);
    const list = await page.evaluate(() => window.model.log.list);
    const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => !new RegExp('.*ldaqdip.*').test(hostname));
    const isUserNameMatching = list.map((element) => element.username).every((username) => new RegExp('a.iceda.').test(username));

    assert.ok(list.length > 0);
    assert.ok(isHostNameMatching);
    assert.ok(isUserNameMatching);
  });

  it('successfully show indicator when user double pressed the log row', async () => {
    const tableRow = await page.$('body > div:nth-child(2) > div:nth-child(2) > main > div > div > div > table > tbody > tr');
    await tableRow.click({clickCount: 2});
    await page.waitForTimeout(200);
    const indicatorOpen = await page.evaluate(() => window.model.inspectorEnabled);
    assert.ok(indicatorOpen);
  });

  it('should go to mode live in paused state', async () => {
    const activeMode = await page.evaluate(() => {
      window.model.log.liveStop('Paused');
      return window.model.log.activeMode;
    });

    assert.deepStrictEqual(activeMode, 'Paused');
  });

  it('should go to mode query', async () => {
    const activeMode = await page.evaluate(() => {
      window.model.log.liveStart();
      window.model.log.liveStop('Query');
      return window.model.log.activeMode;
    });

    assert.deepStrictEqual(activeMode, 'Query');
  });

  it('should go to mode query if mode not specified', async () => {
    const activeMode = await page.evaluate(() => {
      window.model.log.liveStart();
      window.model.log.liveStop();
      return window.model.log.activeMode;
    });

    assert.deepStrictEqual(activeMode, 'Query');
  });
});





