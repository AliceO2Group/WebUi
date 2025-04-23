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

import { strictEqual, deepStrictEqual } from 'node:assert';

const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const layoutListPageTests = async (url, page, timeout = 5000, testParent) => {
  const officialLayoutIndex = 1;
  const myLayoutIndex = 2;
  const allLayoutIndex = 3;

  const basePath = (index) => `section > div > div:nth-child(${index})`;
  const toggleFolderPath = (index) => `${basePath(index)} div > b`;

  const folderOpenedPath = 'section > div > div .cardGroupRow';

  await testParent.test('should successfully load layoutList page "/"', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should have folders closed upon page render', async () => {
    const pagesFolded = await page.evaluate((path) => document.querySelectorAll(path).length, folderOpenedPath);

    strictEqual(pagesFolded, 0, 'Layout cards should not exist initially');
  });
  await testParent.test('should have folder for official layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path).textContent.trim(), toggleFolderPath(officialLayoutIndex));

    deepStrictEqual(label, 'Official');
  });

  await testParent.test('should have folder for personal layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path).textContent.trim(), toggleFolderPath(myLayoutIndex));

    deepStrictEqual(label, 'My Layouts');
  });

  await testParent.test('should have folder for all layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path)?.textContent.trim(), toggleFolderPath(allLayoutIndex));

    deepStrictEqual(label, 'All Layouts');
  });
};
