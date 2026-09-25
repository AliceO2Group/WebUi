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
const { injectLogs } = require('../utils/utils');

/**
 * Fills the logs table with 200 logs and scrolls to the bottom to test autoscroll behavior.
 * @param {Page} page - puppeteer page
 */
const fillTableAndScrollToBottom = async (page) => {
  // ensure table has more rows than fit on screen and is scrolled to the bottom
  // as the test case is where scrollTop clamps back to 0
  await injectLogs(page, Array.from({ length: 200 }, (_, i) => ({
    severity: 'I',
    message: `info log ${i}`,
    timestamp: Date.now() + i,
  })));

  await page.evaluate(() => model.log.goToLastItem());
  await page.waitForFunction(() => model.log.scrollTop > 0, { timeout: 5000 });
};

/**
 * Waits for autoScrollLive to be set to the expected value.
 * @param {Page} page - puppeteer page
 * @param {boolean} expected - expected value of autoScrollLive
 */
const waitForAutoScrollLiveToBe = async (page, expected) => {
  await page.waitForFunction((expected) => model.log.autoScrollLive === expected, { timeout: 5000 }, expected);
};

describe('Logs Table test-suite', async () => {
  let page = null;
  before(async () => {
    ({ page } = test);
  });

  after(async () => {
    await page.evaluate(() => model.log.liveStop('Query'));
  });

  it('should disable autoscroll when the user scrolls up in query mode', async () => {
    await page.click('#query-button');
    await fillTableAndScrollToBottom(page);

    await page.evaluate(() => model.log.enableAutoScroll());
    assert.strictEqual(await page.evaluate(() => model.log.autoScrollLive), true);

    const scrollTopAtBottom = await page.evaluate(() => model.log.scrollTop);
    await page.evaluate(() => {
      document.querySelector('.tableLogsContent').scrollTop -= 100;
    });
    // model.log.scrollTop is only updated by the scroll handler, so this waits for it to have run
    await page.waitForFunction(
      (previous) => model.log.scrollTop < previous,
      { timeout: 5000 },
      scrollTopAtBottom,
    );

    await waitForAutoScrollLiveToBe(page, false);
  });

  it('should disable autoscroll when the user scrolls up in live mode', async () => {
    await page.click('#live-button');

    await waitForAutoScrollLiveToBe(page, true);

    // wait until live logs overflow the table and autoscroll has moved it down
    await page.waitForFunction(() => model.log.scrollTop > 0, { timeout: 5000 });

    await page.evaluate(() => {
      document.querySelector('.tableLogsContent').scrollTop = 100;
    });
    await page.waitForFunction(() => model.log.scrollTop === 0, { timeout: 5000 });

    await waitForAutoScrollLiveToBe(page, false);
  });

  describe('should not disable autoscroll when table shrinks', async () => {
    it('switching from a full query mode to live mode', async () => {
      await page.evaluate(() => model.log.liveStop('Query'));
      await fillTableAndScrollToBottom(page);

      await page.click('#live-button');
      await page.waitForFunction(() => model.log.scrollTop === 0, { timeout: 5000 });

      await waitForAutoScrollLiveToBe(page, true);
    });

    it('clearing log list in query mode', async () => {
      await page.evaluate(() => model.log.liveStop('Query'));

      await page.evaluate(() => model.log.enableAutoScroll());
      await waitForAutoScrollLiveToBe(page, true);

      await fillTableAndScrollToBottom(page);

      await page.click('#clear-button');
      await page.waitForFunction(() => model.log.scrollTop === 0, { timeout: 5000 });

      await waitForAutoScrollLiveToBe(page, true);
    });

    it('clearing log list in live mode', async () => {
      await page.click('#live-button');

      await waitForAutoScrollLiveToBe(page, true);

      // wait until logs are loaded and starting to scroll
      await page.waitForFunction(() => model.log.scrollTop > 0, { timeout: 5000 });

      await page.click('#clear-button');
      // the scroll event of scrollTop fires on a later frame
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));

      await waitForAutoScrollLiveToBe(page, true);
    });
  });
});
