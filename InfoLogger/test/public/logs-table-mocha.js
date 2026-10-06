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
 * Waits for the logs table to be scrolled past the bottom.
 * @param {Page} page - puppeteer page
 */
const waitForScrollPastBottom = async (page) => {
  await page.waitForFunction(() => model.log.dom.table.scrollTop > 0, { timeout: 5000 });
};

/**
 * Fills the logs table with 200 logs and scrolls to the bottom to test autoscroll behavior.
 * @param {Page} page - puppeteer page
 */
const fillTableAndScrollToBottom = async (page) => {
  // ensure table has more rows than fit on the screen
  await injectLogs(page, Array.from({ length: 200 }, (_, i) => ({
    severity: 'I',
    message: `info log ${i}`,
    timestamp: Date.now() + i,
  })));

  await page.evaluate(() => model.log.goToLastItem());
  await waitForScrollPastBottom(page);
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
 * Scrolls the logs table with a real mouse wheel event, as autoscroll reacts to user input rather than scroll position
 * @param {Page} page - puppeteer page
 * @param {number} deltaY - wheel delta, negative scrolls up
 */
const wheelOverTable = async (page, deltaY) => {
  const box = await (await page.$('.tableLogsContent')).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel({ deltaY });
};

/**
 * Allows waiting for a specified number of animation frames
 * Useful when dealing with scroll and layout changes that require dealing with what occurs in each animation frame.
 * @param {Page} page - puppeteer page
 * @param {*} frames - number of frames to wait for
 * @returns {Promise<void>} resolves after the specified number of animation frames
 */
const waitForAnimationFrame = (page, frames = 1) =>
  page.evaluate((frames) => new Promise((resolve) => {
    const step = () => {
      if (frames <= 0) {
        resolve();
      } else {
        frames--;
        requestAnimationFrame(step);
      }
    };
    step();
  }), frames);

describe('Logs Table test-suite', async () => {
  let page = null;
  let baseUrl = null;

  before(async () => {
    ({ helpers: { baseUrl }, page } = test);
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  });

  describe('Autoscroll behavior', async () => {
    describe('in live mode', async () => {
      beforeEach(async () => {
        await page.waitForSelector('#live-button:not([disabled])');
        await page.evaluate(() => model.log.liveStop('Query'));
        await page.evaluate(() => model.zoom.resetZoom());
        await page.evaluate(() => model.log.empty());
        await page.waitForFunction(() => model.log.dom.table.scrollTop === 0);
      });

      after(async () => {
        await page.evaluate(() => model.log.liveStop('Query'));
        await page.evaluate(() => model.zoom.resetZoom());
      });

      it('should disable autoscroll when the user scrolls up', async () => {
        await page.click('#live-button');
        await assertAutoScrollLive(page, true);

        // wait until live logs overflow the table and autoscroll has moved it down
        await waitForScrollPastBottom(page);

        await wheelOverTable(page, -100);
        await waitForAnimationFrame(page, 2);

        await assertAutoScrollLive(page, false);
      });

      it('should re-enable autoscroll when the user scrolls back to the bottom', async () => {
        await page.click('#live-button');
        await waitForScrollPastBottom(page);

        await wheelOverTable(page, -100);
        await waitForAnimationFrame(page, 2);
        await assertAutoScrollLive(page, false);

        await wheelOverTable(page, 100000);
        await waitForAnimationFrame(page, 2);
        await page.waitForFunction(() => model.log.autoScrollLive === true, { timeout: 5000 });
      });

      it('should not disable autoscroll when switching from a full query table to live mode', async () => {
        await fillTableAndScrollToBottom(page);

        await page.click('#live-button');
        await waitForAnimationFrame(page, 2);

        await assertAutoScrollLive(page, true);
      });

      it('should not disable autoscroll when the log list is cleared', async () => {
        await page.click('#live-button');
        await assertAutoScrollLive(page, true);

        // wait until live logs overflow the table and autoscroll has moved it down
        await waitForScrollPastBottom(page);

        await page.click('#clear-button');
        await waitForAnimationFrame(page, 2);

        await assertAutoScrollLive(page, true);
      });

      it('should not disable autoscroll when zooming in', async () => {
        await page.click('#live-button');
        await assertAutoScrollLive(page, true);
        await waitForScrollPastBottom(page);

        await page.evaluate(() => new Promise((resolve) => {
          // queue a scroll event as the autoscroll jump does (1px still counts as the bottom)...
          model.log.dom.table.scrollTop -= 1;
          // ...and zoom before that event is handled, as with a fast zoom click
          model.zoom.zoomIn();
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        }));

        await assertAutoScrollLive(page, true);
      });
    });
  });
});
