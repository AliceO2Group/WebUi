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

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));
const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const layoutListPageTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should successfully load layoutList page "/"', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should have a table with rows for Official Layouts', async () => {
    const label = await page.evaluate(() => document.querySelector('section > div > div > div > b').innerText);
    strictEqual(label?.trim(), 'Official');

    const noContentTable = await page.evaluate(() =>
      document.querySelector('section > div > div > table > tbody > tr > td').innerText);
    strictEqual(noContentTable?.trim(), 'No layouts found');
  });

  await testParent.test('should have a table with rows for users layouts', async () => {
    const label = await page.evaluate(() =>
      document.querySelector('section > div > div:nth-child(2) > div > b').innerText);
    strictEqual(label?.trim(), 'My Layouts');

    const tableContentLength = await page.evaluate(() =>
      document.querySelector('section > div > div:nth-child(2) > table > tbody').childElementCount);
    ok(tableContentLength >= 1);
  });

  await testParent.test('should display layouts sorted alphabetically in users layouts', async () => {
    const numberOfLayoutsOfUser = await page.evaluate(() =>
      document.querySelector('section > div > div:nth-child(2) > table > tbody').childElementCount);

    const layoutNames = [];
    for (let i = 0; i < numberOfLayoutsOfUser; i++) {
      const layoutName = await page.evaluate(
        (i) => {
          const pathToNameOfLayout =
            `section > div > div:nth-child(2) > table > tbody > tr:nth-child(${i + 1}) > td:nth-child(2)`;
          return document.querySelector(pathToNameOfLayout).innerText;
        },
        i,
      );
      layoutNames.push(layoutName);
    }
    const sortedLayoutsName = layoutNames.slice().sort();
    deepStrictEqual(layoutNames, sortedLayoutsName);
  });

  await testParent.test('should have a table with one row after filtering', async () => {
    await page.locator('header > div > div:nth-child(3) > input').fill('a');
    await delay(200);
    const numberOfFilteredLayoutsOfUser = await page.evaluate(() =>
      document.querySelector('section > div > div:nth-child(2) > table > tbody').childElementCount);
    strictEqual(numberOfFilteredLayoutsOfUser, 1);
  });

  await testParent.test('should have a link to show a layout from users layout', async () => {
    // remove input value for filtering via the layout model rather than the puppeteer page
    await page.evaluate(() => window.model.layout.search(''));
    const pathToLayoutToClick =
      'section > div > div:nth-child(2) > table > tbody > tr:nth-child(2) > td:nth-child(2) > div > a';

    await page.waitForSelector(pathToLayoutToClick, { timeout: 2000 });
    const hrefOfLayoutToClick = await page.evaluate(
      (pathToLayoutToClick) =>
        document.querySelector(pathToLayoutToClick).href,
      pathToLayoutToClick,
    );
    strictEqual(hrefOfLayoutToClick, 'http://localhost:8080/?page=layoutShow&layoutId=671b8c22402408122e2f20dd');

    await page.click(pathToLayoutToClick);
    await page.waitForNetworkIdle();
    const location = await page.evaluate(() => window.location);

    // test clicks on the second layout with ID defined in qcg-mock-data.json
    strictEqual(location.search, '?page=layoutShow&layoutId=671b8c22402408122e2f20dd&tab=main');
  });
};
