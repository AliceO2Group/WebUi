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

const { waitForNextRender } = require('../utils/utils.js');

describe('Copy URL button test-suite', async () => {
  let baseUrl = null;
  let page = null;

  before(async () => {
    ({ helpers: { baseUrl }, page } = test);
    await page.browser().defaultBrowserContext().setPermission(
      new URL(baseUrl).origin,
      { permission: { name: 'clipboard-read' }, state: 'granted' },
      { permission: { name: 'clipboard-write' }, state: 'granted' },
    );
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  });

  after(async () => {
    await page.browser().defaultBrowserContext().clearPermissionOverrides();
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
  });

  it('should display the button with the correct label', async () => {
    const button = await page.waitForSelector('#copy-url');
    const label = await button.evaluate((el) => el.textContent);
    assert.strictEqual(label, 'Copy URL');
  });

  it('should copy a URL carrying the active filter', async () => {
    await page.evaluate(() => {
      model.log.setCriteria('message', 'match', 'needle');
      model.notify();
    });
    await waitForNextRender(page);
    await page.click('#copy-url');
    await page.waitForFunction(() => document.querySelector('#copy-url').textContent.includes('Copied!'));
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());
    const { searchParams } = new URL(copiedText);
    assert.strictEqual(JSON.parse(searchParams.get('q')).message.match, 'needle');
  });

  it('should display a notification on copy failure', async () => {
    await page.evaluate(() => {
      model.notification.hide();
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: () => Promise.reject(new Error('Simulated copy failure')),
        },
        configurable: true,
      });
    });

    await page.click('#copy-url');

    await page.waitForSelector('.notification-content.bg-danger.notification-open');
  });
});
