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

const SHARE_BUTTON = '#share-button';
const NOTIFICATION = '.notification-content';

/**
 * Wait for the notification to be displayed with the expected type and return its message
 * @param {Page} page - puppeteer page
 * @param {string} type - one of primary/success/warning/danger
 * @returns {Promise<string>} - the notification message
 */
const getNotification = async (page, type) => {
  await page.waitForSelector(`${NOTIFICATION}.bg-${type}.notification-open`);
  return (await page.$eval(NOTIFICATION, (el) => el.textContent)).trim();
};

describe('Share button test-suite', () => {
  let page = null;

  before(async () => {
    ({ page } = test);
    await page.goto(test.helpers.baseUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector(SHARE_BUTTON);
  });

  /*
   * Only one notification is displayed at a time and it keeps its type class once hidden;
   * dismiss it so the next test does not match the previous one's notification.
   */
  afterEach(async () => {
    if (await page.$(`${NOTIFICATION}.notification-open`)) {
      await page.click(NOTIFICATION);
      await page.waitForSelector(`${NOTIFICATION}.notification-close`);
    }
  });

  it('should copy the URL of the current page', async () => {
    await page.goto(
      `${test.helpers.baseUrl}?q={"severity":{"in":"E F"}}`,
      { waitUntil: 'networkidle0' },
    );
    await page.waitForSelector(SHARE_BUTTON);

    await page.evaluate(() => {
      window.__copiedValue = '';
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (value) => {
            window.__copiedValue = value;
            return Promise.resolve();
          },
        },
        configurable: true,
      });
    });

    await page.click(SHARE_BUTTON);

    await getNotification(page, 'success');

    const { copied, href } = await page.evaluate(() => ({
      copied: window.__copiedValue,
      href: window.location.href,
    }));

    // What is copied is exactly what the address bar holds, so only one URL ever exists
    assert.strictEqual(copied, href);

    // That URL is fully percent-encoded and round-trips back to the original filter
    assert.ok(!new URL(copied).search.includes('{'), 'query parameter must be percent-encoded');
    assert.strictEqual(new URL(copied).searchParams.get('q'), '{"severity":{"in":"E F"}}');
  });

  it('should show a danger notification if the clipboard API is not available', async () => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    });
    await page.click(SHARE_BUTTON);

    const notificationText = await getNotification(page, 'danger');
    assert.strictEqual(notificationText, 'Clipboard API is not available in this browser.');
  });

  it('should show a danger notification if the clipboard API fails', async () => {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new Error('Random Error')),
        },
        configurable: true,
      });
    });
    await page.click(SHARE_BUTTON);

    const notificationText = await getNotification(page, 'danger');
    assert.strictEqual(notificationText, 'Failed to copy shareable link to clipboard.');
  });
});
