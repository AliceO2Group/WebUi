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
import { delay } from '../../testUtils/delay.js';
const OBJECT_TREE_PAGE_PARAM = '?page=objectTree';
const SORTING_BUTTON_PATH = 'header > div > div:nth-child(3) > div > button';
const LIST_ITEM_PATH = 'ul > li'; // General path for checking existence
const LIST_OBJECT_PATH = '[title="qc/test/object"] li'; // Path specifically for finding objects
const sortOptionPath = (index) => `header > div > div:nth-child(3) > div > div > a:nth-child(${index})`;
const [NAME_ASC_INDEX, NAME_DEC_INDEX] = [1, 2];
const VIRTUAL_TABLEROW_PATH = 'tbody > tr.object-selectable';
const SEARCH_PATH = 'header > div > div:nth-child(3) > input';
const OBJECTS_DESCENDING = ['qc/test/object/2', 'qc/test/object/11', 'qc/test/object/1'];
const OBJECTS_ASCENDING = ['qc/test/object/1', 'qc/test/object/11', 'qc/test/object/2'];

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const objectTreePageTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load objectTree page "/"', { timeout }, async () => {
    await page.goto(`${url}${OBJECT_TREE_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, OBJECT_TREE_PAGE_PARAM);
  });

  await testParent.test('should have a tree as a list', { timeout }, async () => {
    await page.waitForSelector(LIST_ITEM_PATH, { timeout: 1000 });
    const rowsCount = await page.evaluate(
      (LIST_ITEM_PATH) => document.querySelectorAll(LIST_ITEM_PATH).length,
      LIST_ITEM_PATH,
    );
    ok(rowsCount > 1); // more than 1 object in the tree
  });

  await testParent.test('should have a button to sort by (default "Name" ASC)', async () => {
    const sortByButtonTitle = await page.evaluate(() =>
      document.querySelector('header > div > div:nth-child(3) > div > button').title);
    strictEqual(sortByButtonTitle, 'Sort by');
  });

  await testParent.test('should have first element in tree as "qc/test/object/1"', async () => {
    await page.locator('[title="qc/test"]>div').click();
    await page.locator('[title="qc/test/object"]>div').click();
    await delay(50); // Wait for expansion to finish

    const objectIds = await page.evaluate((path) =>
      [...document.querySelectorAll(path)].map((e)=> e.id), LIST_OBJECT_PATH);

    deepStrictEqual(objectIds, OBJECTS_ASCENDING);
  });

  await testParent.test('should sort list of objects by name in descending order', async () => {
    await page.locator(SORTING_BUTTON_PATH).click();
    await page.locator(sortOptionPath(NAME_DEC_INDEX)).click();
    await delay(50); // Wait for sort to finish

    const objectIds = await page.evaluate((path) =>
      [...document.querySelectorAll(path)].map((e)=> e.id), LIST_OBJECT_PATH);

    deepStrictEqual(objectIds, OBJECTS_DESCENDING);
  });

  await testParent.test('should sort virtual table of objects by name in descending order', async () => {
    await page.locator(SEARCH_PATH).fill('qc');
    await delay(50); // Wait for table to load

    const objectTitles = await page.evaluate((rowPath) =>
      [...document.querySelectorAll(rowPath)].map((e)=> e.title), VIRTUAL_TABLEROW_PATH);

    deepStrictEqual(objectTitles, OBJECTS_DESCENDING);
  });

  await testParent.test('should sort virtual table of objects by name in ascending order', async () => {
    await page.locator(SORTING_BUTTON_PATH).click();
    await page.locator(sortOptionPath(NAME_ASC_INDEX)).click();
    await delay(50); // Wait for sort to finish

    const objectIds = await page.evaluate((rowPath) =>
      [...document.querySelectorAll(rowPath)].map((e)=> e.title), VIRTUAL_TABLEROW_PATH);

    deepStrictEqual(objectIds, OBJECTS_ASCENDING);
    await page.locator(SEARCH_PATH).fill(' '); // cleanup for the next test. Whitespace is required for some reason
    await delay(50); // Wait object list to load
  });

  await testParent.test('should sort list of objects by name in ascending order', async () => {
    const objectIds = await page.evaluate((path) =>
      [...document.querySelectorAll(path)].map((e)=> e.id), LIST_OBJECT_PATH);

    deepStrictEqual(objectIds, OBJECTS_ASCENDING);
  });

  await testParent.test('should have filtered results on input search', async () => {
    await page.type('header > div > div:nth-child(3) > input', 'qc/test/object/1');
    const rowsDisplayed = await page.evaluate(() => {
      const rows = [];
      document.querySelectorAll('section > div > div > div > table > tbody > tr')
        .forEach((item) => rows.push(item.innerText));
      return rows;
    }, { timeout: 5000 });
    const filteredRows = rowsDisplayed.filter((name) => name.includes('qc/test/object/1'));
    ok(
      filteredRows.length === rowsDisplayed.length,
      'Not all rows contain the searched term.'
      + `Identified filtered: ${filteredRows.length} and displayed: ${rowsDisplayed.length}`,
    );
  });
};
