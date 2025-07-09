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
const SORTING_BUTTON_PATH = 'header > div > div > div:nth-child(4) > div > button';

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

  await testParent.test('should have a button to sort by (default "Name" ASC)', async () => {
    const sortByButtonTitle = await page.evaluate((path) => document.querySelector(path).title, SORTING_BUTTON_PATH);
    strictEqual(sortByButtonTitle, 'Sort by');
  });

  await testParent.test('should have first element in tree as "qc/test/object/1"', async () => {
    const { name } = await page.evaluate(() => window.model.object.currentList[0]);
    strictEqual(name, 'qc/test/object/1');
  });

  await testParent.test('should sort list of histograms by name in descending order', async () => {
    await page.locator(SORTING_BUTTON_PATH).click();
    const sortingByNameOptionPath = 'header > div > div > div:nth-child(4) > div > div > a:nth-child(2)';
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
    await page.locator(SORTING_BUTTON_PATH).click();
    const sortingByNameOptionPath = 'header > div > div > div:nth-child(4) > div > div > a:nth-child(1)';
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
    await page.type('header > div > div:nth-child(1) > div:nth-child(4) > input', 'qc/test/object/1');
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

  await testParent.test('should verify the span is disabled', async () => {
    const isDisabled = await page.evaluate(() => {
      const span = document.querySelector('header > div > div:nth-child(1) > div:nth-child(2) > span');
      return span?.getAttribute('aria-disabled') === 'true' || span?.classList.contains('disabled');
    });

    ok(isDisabled, 'The span is not disabled as expected');
  });
  await testParent.test('should verify checkbox is not selected with correct title', async () => {
    const checkboxInfo = await page.evaluate(() => {
      const checkbox = document.querySelector('#runsModeCheckbox');
      return {
        isCheckbox: checkbox?.type === 'checkbox',
        isChecked: checkbox?.checked,
        title: checkbox?.title,
      };
    });

    ok(checkboxInfo.isCheckbox);
    ok(!checkboxInfo.isChecked);
    strictEqual(
      checkboxInfo.title,
      'Runs mode is disabled. Enter a run number to enable.',
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

  await testParent.test('should enable checkbox after entering run number and triggering filter', async () => {
    await page.type('#runNumberFilter', '0');
    await page.click('#triggerFilterButton');
    await delay(2000);;

    const result = await page.evaluate(() => {
      const span = document.querySelector('header > div > div:nth-child(1) > div:nth-child(2) > span');
      const checkbox = document.querySelector('#runsModeCheckbox');

      const spanDisabled = span?.getAttribute('aria-disabled') === 'true' || span?.classList.contains('disabled');
      const checkboxEnabled = checkbox && !checkbox.disabled;

      return {
        spanDisabled,
        checkboxEnabled,
      };
    });

    ok(!result.spanDisabled);
    ok(result.checkboxEnabled);
  });

  await testParent.test('should enter runs mode after clicking the checkbox', async () => {
    await page.click('#runsModeCheckbox');

    const statusText = await page.evaluate(() => {
      const runNumber = document.querySelector('#runNumber')?.textContent?.trim();
      const status = document.querySelector('#runStatus')?.textContent?.trim();
      return { status, runNumber };
    });

    strictEqual(statusText.runNumber, '0');
    strictEqual(statusText.status, 'ONGOING');

    //exit runs mode
    await page.click('#runsModeCheckbox');
  });
};
