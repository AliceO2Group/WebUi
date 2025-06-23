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

import { strictEqual, ok, deepStrictEqual } from 'node:assert';

const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';
const FILTER_SELECTOR = 'header #filterElement';

export const filterTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load filter element on layoutListPage', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector(FILTER_SELECTOR);

    const element = await page.$(FILTER_SELECTOR);
    ok(element !== null, 'Filter element does not exist, or is not inside the header');

    const location = await page.evaluate(() => window.location);
    deepStrictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('filter should persist between pages', { timeout }, async () => {
    const runNumber = '0';
    await page.locator('#runNumberFilter').fill(runNumber);
    await page.locator('#filterElement #triggerFilterButton').click();

    let value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, runNumber, 'RunNumber is no longer set');

    await page.locator('.sidebar > a:nth-of-type(3)').click(); // navigate to aboutPage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, runNumber, 'RunNumber is no longer set');

    await page.locator('.sidebar > a:nth-of-type(2)').click(); // navigate to ObjectTreePage.

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, runNumber, 'RunNumber is no longer set');
    await page.waitForSelector('tr:last-of-type td');

    await extendTree(3, 5);
    await page.locator('tr:last-of-type td').click(); // This will select an object
    await page.waitForSelector('.resize-button a');
    await page.locator('.resize-button a').click(); // This would navigate to the objectViewPage

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, runNumber, 'RunNumber is no longer set');

    await page.waitForSelector('.sidebar > div:nth-of-type(3) a:nth-child(1)', { visible: true, stable: true });
    await page.locator('.sidebar > div:nth-of-type(3) a:nth-child(1)').click(); // navigate to layout show

    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, runNumber, 'RunNumber is no longer set');
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

    strictEqual(rowCount, 4); // Due to the filter there are two objects fewer.

    await page.locator('#inputApplyFilters').click(); // Will prevent filter from affecting it.

    await extendTree(2, 4);
    rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);

    strictEqual(rowCount, 6); // Due to the filter being removed, there are now 6 rows.
  });

  await testParent.test('ObjectShow should only list versions based on the filter', { timeout }, async () => {
    // For whatever reason, click and locator.click cannot be used for this. Hence why evalutate is used.
    await page.evaluate(() => document.querySelector('#subcanvas > div:nth-child(1) a.btn').click());
    await page.waitForSelector('#ObjectPlot select option');

    let versionCount = await page.evaluate(() => document.querySelectorAll('#ObjectPlot select option').length);
    strictEqual(versionCount, 1);

    await page.locator('#filterElement #clearFilterButton').click();
    await page.locator('#filterElement #triggerFilterButton').click();

    await page.waitForSelector('#ObjectPlot select option:nth-child(2)');

    versionCount = await page.evaluate(() => document.querySelectorAll('#ObjectPlot select option').length);
    strictEqual(versionCount, 2);
  });

  await testParent.test('ObjectTreePage should apply filters for the objects', { timeout }, async () => {
    await page.locator('.sidebar > a:nth-of-type(2)').click(); // navigate to ObjectTreePage.

    await extendTree(3, 5);
    let rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);
    strictEqual(rowCount, 7); // Due to the filter there are two objects fewer.

    const runNumber = '0';
    await page.locator('#runNumberFilter').fill(runNumber);
    await page.locator('#filterElement #triggerFilterButton').click();

    await extendTree(3, 5);

    rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);
    strictEqual(rowCount, 5); // Due to the filter there are two objects fewer.
  });

  await testParent.test('ObjectTree infoPanel should show filtered object versions', { timeout }, async () => {
    const versionsPath = '.outline-gray.flex-grow.relative select option';
    await page.locator('tr:last-of-type td').click();
    await page.waitForSelector(versionsPath);

    let versionCount = await page.evaluate((path) => document.querySelectorAll(path).length, versionsPath);
    strictEqual(versionCount, 1);

    await page.locator('#filterElement #clearFilterButton').click();
    await page.locator('#filterElement #triggerFilterButton').click();

    await extendTree(3, 5);

    await page.locator('tr:nth-of-type(4)').click(); // object/1 is now in the 4th row.
    await page.waitForSelector(versionsPath);

    versionCount = await page.evaluate((path) => document.querySelectorAll(path).length, versionsPath);
    strictEqual(versionCount, 2);
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
