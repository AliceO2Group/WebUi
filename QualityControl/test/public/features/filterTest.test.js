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

import { deepEqual, ok, strictEqual } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { log } from 'node:console';

const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';
const FILTER_SELECTOR = 'header #filterElement';

export const filterTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load filter element on layoutListPage', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(FILTER_SELECTOR);

    const element = await page.$(FILTER_SELECTOR);
    ok(element !== null, 'Filter element does not exist, or is not inside the header');

    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('filter should persist between pages', { timeout }, async () => {
    const runNumber = '0';
    await page.locator('#runNumberFilter').fill('0');
    await page.click('#filterElement button');

    let value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.click('.sidebar > a:nth-of-type(3)'); // navigate to aboutPage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.click('.sidebar > a:nth-of-type(2)'); // navigate to ObjectTreePage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');
    await page.waitForSelector('tr:last-of-type td');

    await extendTree(3, 5);
    await page.click('tr:last-of-type td'); // This will select an object
    await page.waitForSelector('.resize-button a');
    await page.click('.resize-button a'); // This would navigate to the objectViewPage

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');

    await page.waitForSelector('.sidebar > div:nth-of-type(3) a:nth-child(1)', { visible: true, stable: true });
    await page.click('.sidebar > div:nth-of-type(3) a:nth-child(1)'); // navigate to layout show

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    deepEqual(value, runNumber, 'RunNumber is no longer set');
  });

  await testParent.test('should list all objects when disabling objectFilters', { timeout }, async () => {
    const buttonPath = 'header > div > div > div:nth-child(3) > div > div> button';
    const optionPath = 'header > div > div > div:nth-child(3) > div > div > div > div > a:nth-child(1)';
    await page.waitForSelector(buttonPath, { visible: true, stable: true });
    await page.locator(buttonPath).click();

    await page.waitForSelector(optionPath, { visible: true, stable: true });
    await page.locator(optionPath).click();

    await extendTree(2, 4);
    let rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);

    deepEqual(rowCount, 4); // Due to the filter there are two objects fewer.

    await page.locator('#inputApplyFilters').click(); // Will prevent filter from affecting it.

    await extendTree(2, 4);
    rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);

    deepEqual(rowCount, 6); // Due to the filter being removed, there are now 6 rows.
  });

  /**
   * Helper function to extend object trees
   * @param {number} startIndex - The number of rows that the objectTree starts of with.
   * @param {number} subtreeCount - The number of rows at which you stop extending the tree.
   */
  async function extendTree(startIndex, subtreeCount) {
    await page.waitForSelector('tr:last-of-type td');

    for (let i = startIndex; i < subtreeCount; i++) {
      await page.locator('tr:last-of-type td').click();
      await page.waitForFunction((count) => document.querySelectorAll('tr').length > count, {}, i);
    }
  }
};
