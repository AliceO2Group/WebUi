/* eslint-disable @stylistic/js/max-len */
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

describe('Live Mode test-suite', async () => {
  let baseUrl;
  let page;
  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
  });

  it('should successfully go to homepage with predefined filters', async () => {
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
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
    await page.waitForFunction('window.model.log.list.length > 0', { timeout: 5000 });
    const list = await page.evaluate(() => window.model.log.list);
    assert.ok(Boolean(list.length));
  });

  it('should filter messages based on `hostname` matching `aldaqecs01-v1` from live -> paused -> live', async () => {
    await page.evaluate(() => window.model.log.liveStop('Paused'));
    await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('hostname', 'match', 'aldaqecs01-v1');
    });
    await page.evaluate(() => window.model.log.liveStart());
    await page.waitForFunction('window.model.log.list.length > 5', { timeout: 5000 });
    const list = await page.evaluate(() => window.model.log.list);
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
    await page.waitForFunction('window.model.log.list.length > 5', { timeout: 5000 });

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
    await page.waitForFunction('window.model.log.list.length > 5', { timeout: 5000 });

    const list = await page.evaluate(() => window.model.log.list);
    const isHostNameMatching = list.map((element) => element.hostname).every((hostname) => !new RegExp('.*ldaqdip.*').test(hostname));
    const isUserNameMatching = list.map((element) => element.username).every((username) => new RegExp('a.iceda.').test(username));

    assert.ok(list.length > 0);
    assert.ok(isHostNameMatching);
    assert.ok(isUserNameMatching);
  });

  it('should successfully enable LIVE mode from url parameter', async () => {
    // await page.waitForNavigation().goto(`${baseUrl}?live=true`, { waitUntil: 'networkidle0' });

    await Promise.all([page.goto(`${baseUrl}?live=true`, { waitUntil: 'networkidle0' })]);

    // await waitUntil(async () => await page.$eval('.btn-success', (el) => {
    //   el.outerHTML;
    // }));

    // await waitUntil(, 100);
    const location = await page.evaluate(() => window.model.guiReadyToUse);
    console.log('JH HIER!');

    // const htmlsl = await page.$eval('.btn-success', (el) => {
    //   console.log(el);
    //   el.outerHTML;
    // });

    const foo = async () => new Promise((resolve) => {
      setTimeout(resolve, 3000);
    });
    (async () => {
      await foo();
    })();

    const elements = await page.$$('.btn-success');
    // const elements = await page.$$('.active');

    if (elements.length > 0) {
      console.log('Element exists');
    } else {
      console.log('Element does not exist');
    }

    console.log('Check success button');
    // console.log(htmlsl);
    console.log(location);
    console.log(location.search);

    const search = decodeURIComponent(location.search);

    // for now, check if redirected to default page
    assert.strictEqual(search, '?q={"severity":{"in":"I W E F"}}&live=true');
  });

  it('should successfully go to mode LIVE in paused state', async () => {
    const activeMode = await page.evaluate(() => {
      window.model.log.liveStop('Paused');
      return window.model.log.activeMode;
    });

    assert.deepStrictEqual(activeMode, 'Paused');
  });

  it('successfully show indicator when user double pressed the log row', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > main > div > div > div > table > tbody > tr', { timeout: 5000 });
    const tableRow = await page.$('body > div:nth-child(2) > div:nth-child(2) > main > div > div > div > table > tbody > tr');
    await tableRow.click({ clickCount: 2 });
    await page.waitForSelector('#inspector-sidebar', { timeout: 1000 });

    const indicatorOpen = await page.evaluate(() => window.model.inspectorEnabled);
    assert.ok(indicatorOpen);
  });

  // it('should successfully enable LIVE mode from url parameter', async () => {
  //   // await page.waitForNavigation().goto(`${baseUrl}?live=true`, { waitUntil: 'networkidle0' });

  //   await Promise.all([
  //     page.goto(`${baseUrl}?live=true`, { waitUntil: 'networkidle0' }),
  //     page.waitForNavigation(),
  //   ]);

  //   const location = await page.evaluate(() => window.location);
  //   console.log(location.search);

  //   const search = decodeURIComponent(location.search);

  //   // for now, check if redirected to default page
  //   assert.strictEqual(search, '?q={"severity":{"in":"I W E F"}}&live=true');
  // });

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
const waitTillHTMLRendered = async (page, timeout = 30000) => {
  const checkDurationMsecs = 1000;
  const maxChecks = timeout / checkDurationMsecs;
  let lastHTMLSize = 0;
  let checkCounts = 1;
  let countStableSizeIterations = 0;
  const minStableSizeIterations = 3;

  while (checkCounts++ <= maxChecks) {
    const html = await page.content();
    const currentHTMLSize = html.length;

    const bodyHTMLSize = await page.evaluate(() => document.body.innerHTML.length);

    console.log('last: ', lastHTMLSize, ' <> curr: ', currentHTMLSize, ' body html size: ', bodyHTMLSize);

    if (lastHTMLSize != 0 && currentHTMLSize == lastHTMLSize) {
      countStableSizeIterations++;
    } else {
      countStableSizeIterations = 0;
    } //reset the counter

    if (countStableSizeIterations >= minStableSizeIterations) {
      console.log('Page rendered fully..');
      break;
    }

    lastHTMLSize = currentHTMLSize;
    await page.waitForTimeout(checkDurationMsecs);
  }
};

const waitUntil = async (condition, intervalMS) => await new Promise((resolve) => {
  const interval = setInterval(() => {
    try {
      console.log(condition);
      if (condition) {
        resolve(true);
        clearInterval(interval);
      };
    } catch (error) { /* empty */ }
  }, intervalMS);
});
