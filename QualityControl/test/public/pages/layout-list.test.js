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
import { delay } from './../../testUtils/delay.js';

const LAYOUT_LIST_PAGE_PARAM = '?page=layoutList';

/**
 * Initial page setup tests
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {timeout} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures sub-tests are being awaited
 */
export const layoutListPageTests = async (url, page, timeout = 5000, testParent) => {
  const officialLayoutIndex = 2;
  const officialLayoutIndex2 = 1;
  const myLayoutIndex = 2;
  const allLayoutIndex = 2;
  const allLayoutIndex2 = 3;

  const basePath = (index) => `section > div:nth-child(${index})`;
  const toggleFolderPath = (index, index2) => index2 ? `${basePath(index)} > div:nth-child(${index2}) > div > b` :
    `${basePath(index)} div > b`;
  const cardPath = (index, cardIndex) => `${basePath(index)} .card:nth-child(${cardIndex})`;
  const cardLayoutLinkPath = (cardPath) => `${cardPath} a`;
  const cardOfficialButtonPath = (cardPath) => `${cardPath} > .cardHeader > button`;

  const filterPath = 'section > div > div:nth-child(1) > input';
  const filterObjectPath = 'input.form-control:nth-child(1)';
  await testParent.test('should not show a download button when there is no data', async () => {
    await page.goto(`${url}?page=layoutShow&layoutId=671b8c22402408122e2f20dd&tab=main`, { waitUntil: 'networkidle0' });

    const downloadCount = await page.evaluate(() => document.querySelectorAll('#download-button').length);

    strictEqual(downloadCount, 0);
  });

  await testParent.test('should successfully load layoutList page "/"', { timeout }, async () => {
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should go to layoutList page when clicking on title', { timeout }, async () => {
    await page.goto(`${url}?page=about`, { waitUntil: 'networkidle0' });
    await page.click('#qcgTitle');
    await delay(100);
    await page.waitForNetworkIdle();
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should have folder for official layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path).textContent.trim(), toggleFolderPath(officialLayoutIndex, officialLayoutIndex2));

    strictEqual(label, 'Official');
  });

  await testParent.test('should have folder for personal layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path).textContent.trim(), toggleFolderPath(myLayoutIndex, myLayoutIndex));

    strictEqual(label, 'My Layouts');
  });

  await testParent.test('should be able to close folders', async () => {
    let nrOfOpenedFolders = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    await page.click(toggleFolderPath(officialLayoutIndex)); // This will close a folder
    await delay(1000);

    const nrOfOpenedFolders2 = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    strictEqual(nrOfOpenedFolders - 1, nrOfOpenedFolders2, 'Official Layouts should have closed');

    await page.click(toggleFolderPath(myLayoutIndex, myLayoutIndex)); // This will close a folder
    await delay(100);

    nrOfOpenedFolders = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    strictEqual(nrOfOpenedFolders, nrOfOpenedFolders2 - 1, 'My Layouts should have closed');
  });

  await testParent.test('should be able to open folders', async () => {
    let nrOfOpenedFolders = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    await page.click(toggleFolderPath(officialLayoutIndex)); // This will open a folder
    await delay(100);

    const nrOfOpenedFolders2 = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    strictEqual(nrOfOpenedFolders, nrOfOpenedFolders2 - 1, 'Official Layouts should have opened');

    await page.click(toggleFolderPath(myLayoutIndex, myLayoutIndex)); // This will open a folder
    await delay(100);

    nrOfOpenedFolders = await page.evaluate(() => document.querySelectorAll('.cardGrid').length);

    strictEqual(nrOfOpenedFolders - 1, nrOfOpenedFolders2, 'My Layouts should have opened');
  });

  await testParent.test('should have folder for all layouts', async () => {
    const label = await page.evaluate((path) =>
      document.querySelector(path)?.textContent.trim(), toggleFolderPath(allLayoutIndex, allLayoutIndex2));

    strictEqual(label, 'All Layouts');
  });

  await testParent.test('should have a link to show a layout from users layout', async () => {
    const linkpath = cardLayoutLinkPath(cardPath(myLayoutIndex, 2));
    const href = await page.evaluate((path) => document.querySelector(path).href, linkpath);

    strictEqual(href, 'http://localhost:8080/?page=layoutShow&layoutId=671b8c22402408122e2f20dd');

    await page.click(linkpath);
    await page.waitForNetworkIdle();
    const location = await page.evaluate(() => window.location);

    strictEqual(location.search, '?page=layoutShow&layoutId=671b8c22402408122e2f20dd&tab=main');
  });

  await testParent.test('should add official logo the \'make Official\' button is pressed', async () => {
    const buttonPath = cardOfficialButtonPath(cardPath(myLayoutIndex, 1));

    // Previous test relocated to layout detail page.
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await delay(100);

    let markedAsOfficial = await page.evaluate((path) => document.querySelector(path).textContent.trim(), buttonPath);

    strictEqual(markedAsOfficial, 'Make Official', 'Unofficial layout cardbuttons should state: "Make Official"');

    await page.click(buttonPath);
    await delay(100); // Making a layout official takes a bit.

    markedAsOfficial = await page.evaluate((path) => document.querySelector(path).textContent.trim(), buttonPath);
    strictEqual(markedAsOfficial, 'Make Unofficial', 'Official layout cardbuttons should state: "Make Unofficial"');
  });

  await testParent.test('should remove official logo the \'make Unofficial\' button is pressed', async () => {
    const buttonPath = cardOfficialButtonPath(cardPath(myLayoutIndex, 1));

    await page.click(buttonPath);
    await delay(100);

    const markedAsOfficial = await page.evaluate((path) => document.querySelector(path).textContent.trim(), buttonPath);
    strictEqual(markedAsOfficial, 'Make Official', 'Unofficial layout cardbuttons should state: "Make Official"');
  });

  await testParent.test(`
    should add card to official layouts folder when marked as official in a different folder`, async () => {
    const buttonPath = cardOfficialButtonPath(cardPath(myLayoutIndex, 1));
    const officialLayoutCardPath = cardPath(officialLayoutIndex, 1);
    await delay(100);

    await page.click(buttonPath);
    await delay(100); // Making a layout official takes a bit.

    const officialLayoutCard = await page.evaluate((path) =>
      document.querySelector(path) === null, officialLayoutCardPath);
    strictEqual(officialLayoutCard, false);
  });

  await testParent.test('should remove official layouts from official folder when made unofficial', async () => {
    const buttonPath = cardOfficialButtonPath(cardPath(myLayoutIndex, 1));
    const officialLayoutCardPath = cardPath(officialLayoutIndex - 1, 1);

    await page.click(buttonPath);
    await delay(100); // Making a layout official takes a bit.

    const officialLayoutCard = await page.evaluate((path) =>
      document.querySelector(path) === null, officialLayoutCardPath);
    strictEqual(officialLayoutCard, true, 'The official layout folder should have had a card added in previous test');
  });

  await testParent.test('should have a folder with one card after object path filtering', async () => {
    const preFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(preFilterCardCount, 2);
    await page.locator('#openFilterToggle').click();
    await delay(100);
    await page.locator(filterObjectPath).fill('qc/MCH/QO/');
    await page.locator('#openFilterToggle').click();
    await delay(100);
    const postFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(postFilterCardCount, 1);
  });

  await testParent.test('should show the active filter name', async () => {
    // reset page, thus reset filter/search.
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await delay(100);
    const preFilterText = await page.evaluate(() => document.querySelector('div.mh1').textContent.trim());
    strictEqual(preFilterText, '');
    await page.locator('#openFilterToggle').click();
    await delay(100);
    await page.locator(filterObjectPath).fill('TPC');
    await page.locator('#openFilterToggle').click();
    await delay(100);
    const postFilterText = await page.evaluate(() => document.querySelector('div.mh1').textContent.trim());
    strictEqual(postFilterText, 'Active filters: Object path.');
  });

  await testParent.test('should have a folder with 1 card after object path filtering + regular search', async () => {
    // reset page, thus reset filter/search.
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await delay(100);
    await page.locator('div.m2:nth-child(3) > div:nth-child(1)').click();
    await delay(100);
    const preFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(preFilterCardCount, 5);
    await page.locator('#openFilterToggle').click();
    await delay(100);
    await page.locator(filterObjectPath).fill('object');
    await page.locator('#openFilterToggle').click();
    await delay(100);
    let postFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(postFilterCardCount, 3);
    await page.locator(filterPath).fill('pdpBeamType');
    await delay(100);
    postFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(postFilterCardCount, 1);
  });

  await testParent.test('should have a folder with one card after filtering', async () => {
    // reset page, thus reset filter/search.
    await page.goto(`${url}${LAYOUT_LIST_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    await delay(100);
    const preFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(preFilterCardCount, 2);
    await page.locator(filterPath).fill('a');

    await delay(100);
    const postFilterCardCount = await page.evaluate(() => document.querySelectorAll('.card').length);
    strictEqual(postFilterCardCount, 1);
  });
};
