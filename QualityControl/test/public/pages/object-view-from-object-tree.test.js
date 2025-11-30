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

import { match, strictEqual } from 'node:assert';
const OBJECT_VIEW_PAGE_PARAM = '?page=objectView';

export const objectViewFromObjectTreeTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should load page=objectView and display error message & icon', { timeout }, async () => {
    await page.goto(`${url}${OBJECT_VIEW_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, OBJECT_VIEW_PAGE_PARAM);
    const errorMessageElement = '#Error > span.f3';
    const errorIconElement = '#Error > div.f1 > svg';

    await page.waitForSelector(errorMessageElement, { timeout: 1000 });
    await page.waitForSelector(errorIconElement, { timeout: 1000 });
    const errorMessage = await page.evaluate(
      (element) => document.querySelector(element).textContent,
      errorMessageElement,
    );
    const errorIcon = await page.evaluate(
      (element) => document.querySelector(element).getAttribute('class'),
      errorIconElement,
    );

    strictEqual(errorMessage, 'Invalid URL parameters provided');
    strictEqual(errorIcon, 'icon fill-primary');
  });

  await testParent.test(
    'should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)',
    { timeout },
    async () => {
      const backButtonElement = 'div div div a';
      await page.locator(backButtonElement).click();
      const result = await page.evaluate(() => ({
        location: window.location.search,
        objectSelected: window.model.object.selected,
      }));
      strictEqual(result.location, '?page=objectTree');
      strictEqual(result.objectSelected, null);
    },
  );

  await testParent.test(
    'should load page=objectView & display an error message when a parameter objectName is passed but object not found',
    async () => {
      const objectName = 'NOT_FOUND_OBJECT';
      await page.goto(`${url}?page=objectView&objectName=${objectName}`, { waitUntil: 'networkidle0' });
      const errorMessageElement = '#Error > span.f3';
      await page.waitForSelector(errorMessageElement, { timeout: 1000 });
      const message = await page.evaluate(
        (element) => document.querySelector(element).textContent,
        errorMessageElement,
      );
      match(message, /^Request to server failed/i);
    },
  );

  await testParent.test(
    'should load page=objectView and display a plot when a parameter objectName is passed',
    async () => {
      const path = 'qc/test/object/1';
      await page.goto(`${url}?page=objectView&objectName=${path}`, { waitUntil: 'networkidle0' });
      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').innerText;
        const rootPlotClassList =
                document.querySelector('#ObjectPlot > div:nth-child(2) > div:nth-child(1) > div').classList;
        return { title, rootPlotClassList, selectedObjectPath: window.model.objectViewModel.selected.payload.path };
      });
      strictEqual(result.title, path);
      strictEqual(result.rootPlotClassList[0], 'relative');
      strictEqual(result.rootPlotClassList[1], 'jsroot-container');

      strictEqual(result.selectedObjectPath, path);
    },
  );

  await testParent
    .test('should have an info button with full path and last modified when clicked (plot success)', async () => {
      await page.goto(
        `${url}?page=layoutShow&layoutId=671b95883d23cd0d67bdc787&tab=main`,
        { waitUntil: 'networkidle0' },
      );

      await page.hover('.jsrootdiv');
      const result = await page.evaluate(() => {
        const commonSelectorPath = '.layout-selectable > div';
        const { title } = document.querySelector(`${commonSelectorPath} > div:nth-child(2) > div > button`);
        const infoCommonSelectorPath = `${commonSelectorPath} > div:nth-child(2) > div > div > div > div`;
        const path = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > div`).innerText;
        const pathTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > b`).innerText;
        const lastModifiedTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(6) > b`).innerText;
        return { title, pathTitle, path, lastModifiedTitle };
      });
      strictEqual(result.title, 'View details about histogram');
      strictEqual(result.pathTitle, 'Path');
      strictEqual(result.path, 'qc/test/object/1');
      strictEqual(result.lastModifiedTitle, 'Last Modified');
    });
};
