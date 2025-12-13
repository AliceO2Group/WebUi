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

import { strictEqual } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { removeLocalStorage } from '../../testUtils/localStorage.js';
import { StorageKeysEnum } from '../../../public/common/enums/storageKeys.enum.js';

export const filterTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('filter should persist between pages', { timeout }, async () => {
    // Navigate to objects tree
    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );

    //Fill and trigger the filter
    await page.locator('#runNumberFilter').fill('0');
    await page.locator('#triggerFilterButton').click();

    // URL should contain run number
    const location = await page.evaluate(() => window.location);
    strictEqual(location.href.includes('RunNumber=0'), true, 'URL should contain RunNumber=0');

    //Naviagte to object view
    await extendTree(3, 5);
    await page.locator('tr:last-of-type td').click();
    await page.waitForSelector('#fullscreen-button');
    await page.locator('#fullscreen-button').click();
    await page.waitForSelector('#runNumberFilter', { visible: true });

    // Check that filter is still set to 0
    let value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, '0', 'RunNumber filter should still be set to 0 on objectView page');

    // Navigate to layout show
    await page.locator('.menu-item:nth-child(1)').click();
    await page.waitForSelector('#runNumberFilter', { visible: true });

    // Check that filter is still set to 0
    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, '0', 'RunNumber filter should still be set to 0 on layout show page');
  });

  await testParent.test('should list all objects when clearing filters', { timeout }, async () => {
    //Navigate to object tree
    ///html/body/div[1]/div/nav/a[2]
    await page.locator('nav > a:nth-child(3)').click();

    //With filter applied
    let objectList = await page.evaluate(() => window.model.object.list);
    strictEqual(objectList.length, 1);

    //Clear filters
    await page.locator('#clearFilterButton').click();
    await delay(100);
    objectList = await page.evaluate(() => window.model.object.list);
    strictEqual(objectList.length, 3);
  });

  await testParent.test('ObjectShow should only list versions based on the filter', { timeout }, async () => {
    await page.goto(
      `${url}?page=objectView&objectName=qc/test/object/1`,
      { waitUntil: 'networkidle0' },
    );
    let optionsCount = await page.evaluate(() => document.querySelector('#dateSelector').length);
    strictEqual(optionsCount, 2);

    await page.locator('#runNumberFilter').fill('0');
    await page.locator('#triggerFilterButton').click();

    await delay(200);

    optionsCount = await page.evaluate(() => document.querySelector('#dateSelector').length);
    strictEqual(optionsCount, 1);
  });

  await testParent.test('ObjectTreePage should apply filters for the objects', { timeout }, async () => {
    // Ideally, tests should be isolated and not depend on each other.
    // Currently, some tests rely on shared localStorage or page state changes from previous tests.
    // As a workaround, we do targeted cleanup here to prevent issues in later tests.
    const personid = await page.evaluate(() => window.model.session.personid);
    await removeLocalStorage(page, `${StorageKeysEnum.OBJECT_TREE_OPEN_NODES}-${personid}`);

    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );

    await extendTree(3, 5);
    let rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);
    strictEqual(rowCount, 7);

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
    strictEqual(versionCount, 1, 'Number of versions is not 1');

    await page.locator('#filterElement #clearFilterButton').click();
    await page.locator('#filterElement #triggerFilterButton').click();

    await extendTree(3, 5);

    await page.locator('tr:nth-of-type(4)').click(); // object/1 is now in the 4th row.
    await page.waitForSelector(versionsPath);

    versionCount = await page.evaluate((path) => document.querySelectorAll(path).length, versionsPath);
    strictEqual(versionCount, 2, 'Number of versions is not 2');
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
