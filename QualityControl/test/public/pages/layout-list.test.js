/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */
/* eslint-disable max-len */

const assert = require('assert');
const test = require('../index');

describe('layoutList page test suite', async () => {
  let page; let url;

  before(async () => {
    ({ page, url } = test);
    await page.goto(`${url}?page=layoutList`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=layoutList');
  });

  it('should have a button for online mode in the header', async () => {
    await page.waitForSelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(2)', { timeout: 5000 });
    const onlineButton = await page.evaluate(() =>
      document.querySelector('header > div:nth-child(1) > div:nth-child(1) > button:nth-child(2)').title);
    assert.strictEqual(onlineButton, 'Toggle Mode (Online/Offline)');
  });

  it('should have a table with rows', async () => {
    const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
    assert.ok(rowsCount > 1);
  });

  it('should display layouts sorted alphabetically', async () => {
    const firstLayout = await page.evaluate(() => document.querySelector('section table tbody tr a').innerText);
    assert.strictEqual(firstLayout, 'AliRoot');
  });

  it('should have a table with one row after filtering', async () => {
    await page.type('header input', 'AliRoot');
    await page.waitForTimeout(200);
    const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
    assert.ok(rowsCount === 1);
  });

  it('should have a link to show a layout', async () => {
    await page.evaluate(() => document.querySelector('section table tbody tr a').click());
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea10');
    // Id 5aba4a059b755d517e76ea10 is set in QCModelDemo
  });
});
