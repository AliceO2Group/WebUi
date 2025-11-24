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
const SORTING_BUTTON_PATH = 'header > div > div > div:nth-child(3) > div > button';

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

  await testParent.test('should have a tree as a table', { timeout }, async () => {
    const tableRowPath = 'section > div > div > div > table > tbody > tr';
    await page.waitForSelector(tableRowPath, { timeout: 1000 });
    const rowsCount = await page.evaluate(
      (tableRowPath) => document.querySelectorAll(tableRowPath).length,
      tableRowPath,
    );
    ok(rowsCount > 1); // more than 1 object in the tree
  });

  await testParent.test('should not preserve state if refreshed not in run mode', { timeout }, async () => {
    const tbodyPath = 'section > div > div > div > table > tbody';
    await page.locator(`${tbodyPath} > tr:nth-child(2)`).click();
    await page.reload({ waitUntil: 'networkidle0' });

    const rowCount = await page.evaluate(() =>
      document.querySelectorAll('section > div > div > div > table > tbody > tr').length);

    strictEqual(rowCount, 2);
  });

  await testParent.test('should have a button to sort by (default "Name" ASC)', async () => {
    const sortByButtonTitle = await page.evaluate((path) => document.querySelector(path).title, '#sortTreeButton');
    strictEqual(sortByButtonTitle, 'Sort by');
  });

  await testParent.test('should have first element in tree as "qc/test/object/1"', async () => {
    const { name } = await page.evaluate(() => window.model.object.currentList[0]);
    strictEqual(name, 'qc/test/object/1');
  });

  await testParent.test(
    'should have a correctly made download button',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(2)').click());
      await delay(500);
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(3)').click());
      await delay(500);
      await page.evaluate(() => document.querySelector('tr.object-selectable:nth-child(4)').click());
      await delay(1000);
      const dlButton = await page.evaluate(() => document.querySelector('.download-button').href);
      const token = await page.evaluate(() => model.session.token);
      strictEqual(dlButton, `${url}api/object/proxy/download/?token=${token}&objectIds=${objectId}`);
    },
  );

  await testParent.test(
    'should correctly render the path as first in the object info panel',
    { timeout },
    async () => {
      const firstRowKey = await page.evaluate(() =>
        document.querySelector('#qcObjectInfoPanel > div:first-child > b').textContent);
      strictEqual(firstRowKey, 'Path');
    },
  );

  await testParent.test(
    'should contain four highlighted rows',
    { timeout },
    async () => {
      const highlightedClasses = '.info-row.highlighted';
      const rowCount = await page.evaluate((selector) =>
        document.querySelectorAll(`#qcObjectInfoPanel > div${selector}`).length, highlightedClasses);
      strictEqual(rowCount, 4);
    },
  );

  await testParent.test(
    'should copy the value of the element clicked to the clipboard',
    { timeout },
    async () => {
      const context = page.browserContext();
      await context.overridePermissions(url, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);

      await page.click('#qcObjectInfoPanel > div > div');

      const clipboard = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return navigator.clipboard.readText();
      });

      strictEqual(clipboard, 'qc/test/object/1');
      context.clearPermissionOverrides();
    }
  );

  await testParent.test(
    'should close the object plot upon clicking the close button',
    { timeout },
    async () => {
      await page.evaluate(() => document.querySelector('#close-button').click());
      // wait for animations to finish before continuing
      await page.waitForFunction(
        (selector) => document.querySelector(selector).children.length === 0,
        {},
        'section > div > div > div:nth-child(2)'
      );
      const selectedObject = await page.evaluate(() => model.object.selected);
      const numberOfChildren = await page.evaluate(() =>
        document.querySelector('section > div > div > div:nth-child(2)').children.length);
      strictEqual(selectedObject, undefined);
      strictEqual(numberOfChildren, 0);
    }
  );

  await testParent.test('should sort list of histograms by name in descending order', async () => {
    await page.locator('#sortTreeButton').click();
    const sortingByNameOptionPath = '#sortTreeButton > div > a:nth-child(2)';
    await page.locator(sortingByNameOptionPath).click();

    const sorted = await page.evaluate(() => ({
      list: window.model.object.currentList,
      sort: window.model.object.sortBy,
    }));
    strictEqual(sorted.sort.title, 'Name');
    strictEqual(sorted.sort.order, -1);
    strictEqual(sorted.sort.field, 'name');
    strictEqual(sorted.list[0].name, 'qc/test/object/2');
  });

  await testParent.test('should sort list of histograms by name in ascending order', async () => {
    await page.locator('#sortTreeButton').click();
    const sortingByNameOptionPath = '#sortTreeButton > div > a:nth-child(1)';
    await page.locator(sortingByNameOptionPath).click();
    const sorted = await page.evaluate(() => ({
      list: window.model.object.currentList,
      sort: window.model.object.sortBy,
    }));
    strictEqual(sorted.sort.title, 'Name');
    strictEqual(sorted.sort.order, 1);
    strictEqual(sorted.sort.field, 'name');
    strictEqual(sorted.list[0].name, 'qc/test/object/1');
  });

  await testParent.test('should have filtered results on input search', async () => {
    await page.type('#searchObjectTree', 'qc/test/object/1');
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

  await testParent.test(
    'should have a selector with sorted options to filter by run type if there are run types loaded',
    { timeout },
    async () => {
      const selectorId = '#runTypeFilter > option';

      const options = await page.evaluate((selectorId) => {
        const optionElements = document.querySelectorAll(selectorId);
        return Array.from(optionElements).map((option) => option.value);
      }, selectorId);

      deepStrictEqual(options, ['', 'runType1', 'runType2']);
    },
  );
};
