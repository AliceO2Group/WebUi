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
 * Inject logs and wait for the table to be scrolled down.
 * Useful for live mode, as inserting is much quicker than waiting for the table to fill at 100ms.
 * @param {Page} page - puppeteer page
 */
const injectAndWaitForScrolledDown = async (page) => {
  await injectLogs(page, Array.from({ length: 200 }, (_, i) => ({
    severity: 'I',
    timestamp: Date.now() + i,
  })));
  await waitForScrolledDown(page);
};

/**
 * Waits for the scroll handler to sync it's at the bottom,
 * otherwise the next scroll gets compared against a stale position.
 * @param {Page} page - puppeteer page
 */
const waitForScrolledDown = async (page) => {
  await page.waitForFunction(() => {
    const { scrollTop: realScrollTop } = model.log.dom.table;
    return realScrollTop > 0 && model.log.scrollTop === realScrollTop;
  }, { timeout: 5000 });
};

/**
 * Scrolls the logs table without a wheel event, as a scrollbar drag or keyboard scroll would
 * @param {Page} page - puppeteer page
 * @param {number} deltaY - scroll delta
 * @returns {Promise<void>} resolves once the scroll event has been handled
 */
const scrollOnTable = (page, deltaY) =>
  page.evaluate((deltaY) => new Promise((resolve) => {
    const { table } = model.log.dom;
    const previousScrollTop = table.scrollTop;

    table.addEventListener('scroll', () => resolve(), { once: true });

    table.scrollTop += deltaY;
    // no scroll event fires when already at the top/bottom so resolve to avoid hanging
    if (table.scrollTop === previousScrollTop) {
      resolve();
    }
  }), deltaY);

/**
 * Dispatches a wheel event on the logs table
 * @param {Page} page - puppeteer page
 * @param {number} deltaY - wheel delta
 * @returns {Promise<void>} resolves once the wheel event has been handled
 */
const wheelOnTable = (page, deltaY) =>
  page.evaluate((deltaY) => {
    model.log.dom.table.dispatchEvent(new WheelEvent('wheel', { deltaY }));
  }, deltaY);

/**
 * Asserts that autoScrollLive is the expected value.
 * @param {Page} page - puppeteer page
 * @param {boolean} expected - expected value of autoScrollLive
 */
const assertAutoScrollLive = async (page, expected) => {
  assert.strictEqual(await page.evaluate(() => model.log.autoScrollLive), expected);
};

describe('Auto-scroll test-suite', async () => {
  let page = null;
  let baseUrl = null;

  before(async () => {
    ({ helpers: { baseUrl }, page } = test);
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  });

  describe('in live mode', async () => {
    beforeEach(async () => {
      await page.waitForSelector('#live-button:not([disabled])');
      await page.evaluate(() => model.log.liveStop());
      await page.click('#live-button');
    });

    after(async () => {
      await page.evaluate(() => model.log.liveStop());
      await page.evaluate(() => model.zoom.resetZoom());
    });

    it('should jump to the bottom when autoscroll is re-enabled from the status bar', async () => {
      await injectAndWaitForScrolledDown(page);

      await scrollOnTable(page, -500);
      await assertAutoScrollLive(page, false);

      await page.click('#status-bar-auto-scroll');

      await assertAutoScrollLive(page, true);
      await page.waitForFunction(() => {
        const { scrollHeight, scrollTop, clientHeight } = model.log.dom.table;
        return scrollHeight - scrollTop - clientHeight <= 1;
      }, { timeout: 5000 });
    });

    it('should not disable autoscroll when switching from a full query table to live mode', async () => {
      await page.evaluate(() => model.log.liveStop());

      await injectLogs(page, Array.from({ length: 200 }, (_, i) => ({
        severity: 'I',
        message: `info log ${i}`,
        timestamp: Date.now() + i,
      })));
      await page.evaluate(() => model.log.goToLastItem());
      await waitForScrolledDown(page);
      await page.click('#live-button');

      await assertAutoScrollLive(page, true);
    });

    it('should not disable autoscroll when zooming in and out', async () => {
      await page.evaluate(() => {
        model.log.autoScrollLive = true;
      });
      await injectAndWaitForScrolledDown(page);
      await page.click('#zoom-in-button');
      await assertAutoScrollLive(page, true);

      await page.click('#zoom-out-button');
      await assertAutoScrollLive(page, true);
    });

    const scrollActions = [
      { name: 'wheel', action: (deltaY) => wheelOnTable(page, deltaY) },
      { name: 'scroll', action: (deltaY) => scrollOnTable(page, deltaY) },
    ];

    scrollActions.forEach((movement) => {
      describe(`when performing via: ${movement.name}`, async () => {
        beforeEach(async () => {
          await page.evaluate(() => model.log.liveStop());
          await page.click('#live-button');
        });

        it('should disable autoscroll when the user moves up', async () => {
          await injectAndWaitForScrolledDown(page);

          await movement.action(-100);

          await assertAutoScrollLive(page, false);
        });

        it('should not disable autoscroll when the user moves up with the table already at the top', async () => {
          await movement.action(-100);

          await assertAutoScrollLive(page, true);
        });

        it('should not disable autoscroll when the user moves down', async () => {
          await injectAndWaitForScrolledDown(page);

          await movement.action(100);

          await assertAutoScrollLive(page, true);
        });
      });
    });
  });
});
