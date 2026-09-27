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
 * Asserts that autoScrollLive is the expected value.
 * @param {Page} page - puppeteer page
 * @param {boolean} expected - expected value of autoScrollLive
 */
const assertAutoScrollLive = async (page, expected) => {
  assert.strictEqual(await page.evaluate(() => model.log.autoScrollLive), expected);
};

/**
 * Returns the scroll position last recorded by the table's scroll handler.
 * @param {Page} page - puppeteer page
 * @returns {Promise<number>} model.log.scrollTop
 */
const getScrollTop = (page) => page.evaluate(() => model.log.scrollTop);

/**
 * Waits until the table's scroll handler has recorded a scroll position below `previousScrollTop`.
 * model.log.scrollTop is only updated by the scroll handler, so this proves it has run.
 * @param {Page} page - puppeteer page
 * @param {number} previousScrollTop - scroll position before the action under test
 */
const waitForScrollTopBelow = (page, previousScrollTop) =>
  page.waitForFunction((previous) => model.log.scrollTop < previous, { timeout: 5000 }, previousScrollTop);

describe('Logs Table test-suite', async () => {
  let page = null;
  let baseUrl = null;

  before(async () => {
    ({ helpers: { baseUrl }, page } = test);
  });

  beforeEach(async () => {
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  });

  after(async () => {
    await page.evaluate(() => model.log.liveStop('Query'));
  });

  describe('Autoscroll behavior', async () => {
    describe('in query mode', async () => {
      it('should disable autoscroll when the user scrolls up', async () => {
        await fillTableAndScrollToBottom(page);
        await page.evaluate(() => model.log.enableAutoScroll());
        await assertAutoScrollLive(page, true);

        const scrollTopAtBottom = await getScrollTop(page);
        await page.evaluate(() => {
          document.querySelector('.tableLogsContent').scrollTop -= 100;
        });
        await waitForScrollTopBelow(page, scrollTopAtBottom);

        await assertAutoScrollLive(page, false);
      });

      it('should not disable autoscroll when the log list is cleared', async () => {
        await page.evaluate(() => model.log.enableAutoScroll());
        await fillTableAndScrollToBottom(page);
        await assertAutoScrollLive(page, true);

        const scrollTopAtBottom = await getScrollTop(page);
        await page.click('#clear-button');
        await waitForScrollTopBelow(page, scrollTopAtBottom);

        await assertAutoScrollLive(page, true);
      });
    });

    describe('in live mode', async () => {
      beforeEach(async () => {
        await page.waitForSelector('#live-button:not([disabled])');
      });

      it('should disable autoscroll when the user scrolls up', async () => {
        await page.click('#live-button');
        await assertAutoScrollLive(page, true);

        // wait until live logs overflow the table and autoscroll has moved it down
        await page.waitForFunction(() => model.log.scrollTop > 0, { timeout: 5000 });

        const scrollTopAtBottom = await getScrollTop(page);
        await page.evaluate(() => {
          document.querySelector('.tableLogsContent').scrollTop -= 100;
        });
        await waitForScrollTopBelow(page, scrollTopAtBottom);

        await assertAutoScrollLive(page, false);
      });

      it('should not disable autoscroll when switching from a full query table to live mode', async () => {
        await fillTableAndScrollToBottom(page);

        const scrollTopAtBottom = await getScrollTop(page);
        await page.click('#live-button');
        await waitForScrollTopBelow(page, scrollTopAtBottom);

        await assertAutoScrollLive(page, true);
      });

      it('should not disable autoscroll when the log list is cleared', async () => {
        await page.click('#live-button');
        await assertAutoScrollLive(page, true);

        // wait until live logs overflow the table and autoscroll has moved it down
        await page.waitForFunction(() => model.log.scrollTop > 0, { timeout: 5000 });

        const scrollTopAtBottom = await getScrollTop(page);
        await page.click('#clear-button');
        await waitForScrollTopBelow(page, scrollTopAtBottom);

        await assertAutoScrollLive(page, true);
      });
    });
  });
});
