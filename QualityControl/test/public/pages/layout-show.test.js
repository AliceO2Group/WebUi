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

import { editLayoutTests } from './edit-layout.test.js';
import { strictEqual, ok, deepStrictEqual } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
export const layoutViewTests = async (url, page, timeout = 5000, testParent) => {
/**
 * Performs a series of automated tests on the layoutShow page using Puppeteer.
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {number} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
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

  await editLayoutTests(page, timeout, testParent);
};
