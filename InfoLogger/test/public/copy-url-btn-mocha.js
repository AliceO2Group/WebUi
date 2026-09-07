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

  it('should display the button with the correct label', async () => {
    const button = await page.$('#copy-url');
    const label = await page.evaluate((el) => el.textContent, button);
    assert.strictEqual(label, 'Copy URL');
  });

  it('should copy a URL carrying the active filter', async () => {
    await page.evaluate(() => {
      window.model.log.filter.setCriteria('message', 'match', 'needle');
      window.model.notify();
    });
    await page.click('#copy-url');
    const copiedText = await page.evaluate(() => navigator.clipboard.readText());
    const expectedUrl = `${baseUrl}?q=%7B%22message%22%3A%7B%22match%22`
    + '%3A%22needle%22%7D%2C%22severity%22%3A%7B%22in%22%3A%22I%20W%20E%20F%22%7D%7D';
    assert.strictEqual(copiedText, expectedUrl);
  });
});
