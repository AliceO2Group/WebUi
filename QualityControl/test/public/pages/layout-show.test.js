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

/**
 * Performs a series of automated tests on the layoutShow page using Puppeteer.
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {number} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const layoutShowTests = async (url, page, timeout = 5000, testParent) => {
  const LAYOUT_ID = '671b95883d23cd0d67bdc787';
  await testParent.test(
    'should load the layoutShow page',
    { timeout },
    async () => {
      await page.goto(`${url}?page=layoutShow&layoutId=${LAYOUT_ID}`, { waitUntil: 'networkidle0' });
      const location = await page.evaluate(() => window.location);
      strictEqual(location.search, `?page=layoutShow&layoutId=${LAYOUT_ID}&tab=main`);
    },
  );

  await testParent.test(
    'should have an input to filter by run type if there are no run types loaded',
    { timeout },
    async () => {
      const inputTypeInfo = await page.evaluate(() => {
        const input = document.querySelector('#runTypeLayoutFilter');
        return {
          localName: input.localName,
          placeholder: input.placeholder,
        };
      });
      strictEqual(inputTypeInfo.localName, 'input');
      strictEqual(inputTypeInfo.placeholder, 'RunType (e.g. PHYSICS)');
      await delay(3000);
    },
  );

  await testParent.test(
    'should have a selector with sorted options to filter by run type if there are run types loaded',
    { timeout },
    async () => {
      const MAX_DELAY = 5000;
      const INTERVAL = 500;
      const selectorId = '#runTypeLayoutFilter';

      const getOptionsWithRetry = async () => {
        let options = [];
        let addedDelay = 0;

        while (!options.length && addedDelay < MAX_DELAY) {
          await page.reload();
          await delay(INTERVAL);
          addedDelay += INTERVAL;

          options = await page.evaluate((selectorId) => {
            const select = document.querySelector(selectorId);
            if (!select || !select.options) {
              return [];
            }
            return Array.from(select.options).map((option) => option.value);
          }, selectorId);
        }
        return options;
      };

      const options = await getOptionsWithRetry();
      if (!options.length) {
        throw new Error('El elemento #runTypeLayoutFilter no se encontró después de 5 segundos');
      }

      strictEqual(options[0], '');
      strictEqual(options[1], 'runType1');
      strictEqual(options[2], 'runType2');
    },
  );

  await testParent.test(
    'should have tabs in the header',
    { timeout },
    async () => {
      const tabsPath = 'header .btn-tab';
      const tabsCount = await page.evaluate((tabsPath) => document.querySelectorAll(tabsPath).length, tabsPath);
      strictEqual(tabsCount, 2);
    },
  );

  await testParent.test(
    'should have selected layout in the sidebar highlighted',
    { timeout },
    async () => {
      const layoutClassList = await page.evaluate(() => document
        .querySelector('nav > div:nth-child(5) > a:nth-child(1)').classList);
      deepStrictEqual(layoutClassList, { 0: 'menu-item', 1: 'w-wrapped', 2: 'selected' });
    },
  );

  await testParent.test(
    'should have jsroot svg plots in the section',
    { timeout },
    async () => {
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      ok(plotsCount > 1);
    },
  );

  await testParent
    .test('should have an info button with full path and last modified when clicked (plot success)', async () => {
      const commonSelectorPath = 'section > div > div > div:nth-child(2) > div > div > div';
      const plot1Path = `${commonSelectorPath} > div:nth-child(1)`;
      await page.locator(plot1Path).click();

      const result = await page.evaluate((commonSelectorPath) => {
        const { title } = document.querySelector(`${commonSelectorPath} > div:nth-child(2) > div > div > button`);
        const infoCommonSelectorPath = `${commonSelectorPath} > div:nth-child(2) > div > div > div > div > div`;
        const objectPath = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(2) > div > div`).innerText;
        const pathTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(2) > b`).innerText;
        const lastModifiedTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(6) > b`).innerText;
        return { title, pathTitle, objectPath, lastModifiedTitle };
      }, commonSelectorPath);
      strictEqual(result.title, 'View details about histogram');
      strictEqual(result.pathTitle, 'path');
      strictEqual(result.objectPath, 'qc/test/object/1');
      strictEqual(result.lastModifiedTitle, 'lastModified');
    });

  await testParent.test(
    'should have an info button with full path and last modified when clicked on a second plot(plot success)',
    { timeout },
    async () => {
      const commonSelectorPath = 'section > div > div > div:nth-child(2) > div:nth-child(2) > div > div';
      const plot2Path = `${commonSelectorPath} > div:nth-child(1)`;
      await page.locator(plot2Path).click();
      const result = await page.evaluate((commonSelectorPath) => {
        const { title } = document.querySelector(`${commonSelectorPath} > div:nth-child(2) > div > div > button`);
        const infoCommonSelectorPath = `${commonSelectorPath} > div:nth-child(2) > div > div > div > div > div`;
        const objectPath = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(2) > div > div`).innerText;
        const pathTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(2) > b`).innerText;
        const lastModifiedTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(6) > b`).innerText;
        return { title, pathTitle, objectPath, lastModifiedTitle };
      }, commonSelectorPath);
      strictEqual(result.title, 'View details about histogram');
      strictEqual(result.pathTitle, 'path');
      strictEqual(result.objectPath, 'qc/test/object/1');
      strictEqual(result.lastModifiedTitle, 'lastModified');
    },
  );

  await testParent.test(
    'should have second tab to be empty (according to demo data)',
    { timeout },
    async () => {
      await page.locator('header > div > div:nth-child(2) > div > button:nth-child(2)').click();
      const plotPath = 'section svg.jsroot';
      await delay(1000);
      const plotsCount = await page.evaluate((plotPath) => document.querySelectorAll(plotPath).length, plotPath);
      strictEqual(plotsCount, 0);
    },
  );

  await testParent.test(
    'should have a button group containing four buttons in the header',
    { timeout },
    async () => {
      const count = await page.evaluate(() => {
        const container = document.querySelector('.btn-group');
        return container ? container.children.length : 0;
      });
      strictEqual(count, 4);
    },
  );

  await testParent.test(
    'should have one duplicate button in the header to create a new duplicated layout',
    { timeout },
    async () => {
      const buttonPath = 'header > div > div:nth-child(3) > div > button:nth-child(1)';
      const duplicateButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(duplicateButton, 'Duplicate layout');
    },
  );

  await testParent.test(
    'should have one delete button in the header to delete layout',
    { timeout },
    async () => {
      const buttonPath = 'header > div > div:nth-child(3) > div > button:nth-child(4)';
      const deleteButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(deleteButton, 'Delete layout');
    },
  );

  await testParent.test(
    'should have one link button in the header to download layout skeleton',
    { timeout },
    async () => {
      const buttonPath = 'header > div > div:nth-child(3) > div > a';
      const editButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(editButton, 'Export layout skeleton as JSON file');
    },
  );

  await testParent.test(
    'should have one edit button in the header to go in edit mode',
    { timeout },
    async () => {
      const buttonPath = 'header > div > div:nth-child(3) > div > button:nth-child(3)';
      const editButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(editButton, 'Edit layout');
    },
  );

  await testParent.test(
    'should click the edit button in the header and enter edit mode',
    { timeout },
    async () => {
      const editButtonPath = 'header > div > div:nth-child(3) > div > button:nth-child(3)';
      await page.locator(editButtonPath).click();
    },
  );

  await testParent.test(
    'should have input field for changing layout name in edit mode',
    { timeout },
    async () => {
      const inputPath = 'header > div > div:nth-child(3) > input';
      await page.evaluate((inputPath) => document.querySelector(inputPath), inputPath);
    },
  );

  await testParent.test(
    'should have number input field for allowing users to change auto-tab value',
    { timeout },
    async () => {
      await page.waitForSelector('#inputDescription', { timeout: 5000 });
    },
  );

  await testParent.test(
    'should have a tree sidebar in edit mode',
    { timeout },
    async () => {
      const secondElementPath = 'nav table tbody tr:nth-child(2)';
      await page.locator(secondElementPath).click();
      const rowsCount = await page.evaluate((secondElementPath) =>
        document.querySelectorAll(secondElementPath).length, secondElementPath);
      strictEqual(rowsCount, 1);
    },
  );

  await testParent.test(
    'should have filtered results on input search filled',
    { timeout },
    async () => {
      const inputs = await page.$$('nav input');
      await inputs[3].type('1');
      await delay(50);
      const { count, firstResult, secondResult } = await page.evaluate(() => {
        const rows = document.querySelectorAll('nav table tbody tr');
        return {
          count: rows.length,
          firstResult: rows[0].firstElementChild.textContent,
          secondResult: rows[1].firstElementChild.textContent,
        };
      });
      strictEqual(count, 2);
      strictEqual(firstResult, ' qc/test/object/1');
      strictEqual(secondResult, ' qc/test/object/11');
    },
  );

  await testParent.test(
    'should have no results if query does not match any objects',
    { timeout },
    async () => {
      const inputs = await page.$$('nav input');
      await inputs[3].type('123');
      await delay(50);
      const text = await page.evaluate(() => document.querySelector('nav p.text-center').textContent);
      strictEqual(text, 'No objects found for this search');
    },
  );

  await testParent.test(
    'should show normal sidebar after Cancel click',
    { timeout },
    async () => {
      const cancelButtonPath = 'header > div > div:nth-child(3) > div > button:nth-child(2)';
      await page.locator(cancelButtonPath).click();
      await page.waitForSelector('nav .menu-title', { timeout: 5000 });
    },
  );
};
