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
      strictEqual(message, 'Failed to fetch object at url \'/latest/NOT_FOUND_OBJECT\' and path \'NOT_FOUND_OBJECT\'.');
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

  await testParent.test(
    'should initially hide drawing options panel',
    { timeout },
    async () => {
      const exists = await page.evaluate(() => Boolean(document.querySelector('#objectDrawingOptions')));
      strictEqual(exists, false, 'Drawing options panel should be initially hidden');
    },
  );

  await testParent.test(
    'should show drawing options panel on click visibility toggle button',
    { timeout },
    async () => {
      await page.click('.visibility-toggle-button');
      await delay(100);
      const exists = await page.evaluate(() => Boolean(document.querySelector('#objectDrawingOptions')));
      strictEqual(exists, true, 'Drawing options panel should be visible after click visibility button');
    },
  );

  await testParent.test(
    'should display ignore defaults button',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      const checkboxId = `${objectId}ignoreDefaults`;
      const ignoreDefaultsCheckboxSelector = `#objectDrawingOptions input[id="${checkboxId}"]`;
      const element = await page.evaluate((selector) =>
        Boolean(document.querySelector(selector)), ignoreDefaultsCheckboxSelector);
      strictEqual(element, true, 'Ignore Defaults checkbox not found');
    },
  );

  await testParent.test(
    'should have ignore defaults checkbox unchecked by default',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      const checkboxId = `${objectId}ignoreDefaults`;
      const ignoreDefaultsCheckboxSelector = `#objectDrawingOptions input[id="${checkboxId}"]`;
      const checked = await page.evaluate((selector) =>
        document.querySelector(selector).checked, ignoreDefaultsCheckboxSelector);
      strictEqual(checked, false, 'Ignore Defaults checkbox should be unchecked by default');
    },
  );

  await testParent.test(
    'should update plot when a drawing option is toggled',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      const plotSelector = '#ObjectPlot > div:nth-child(2) > div > div';
      const gridXCheckboxSelector = `#objectDrawingOptions input[id="${objectId}gridx"]`;
      const initialPlot = await page.waitForSelector(plotSelector, { timeout: 1000 });
      const checkboxExists = await page.evaluate((selector) =>
        Boolean(document.querySelector(selector)), gridXCheckboxSelector);
      strictEqual(checkboxExists, true, '"gridx" drawing option checkbox not found');
      const initalGridXEnabled = await page.evaluate((selector) =>
        document.querySelector(selector).checked, gridXCheckboxSelector);

      await page.click(gridXCheckboxSelector);
      await delay(100);
      const gridXEnabled = await page.evaluate((selector) =>
        document.querySelector(selector).checked, gridXCheckboxSelector);
      const afterTogglePlot = await page.waitForSelector(plotSelector, { timeout: 1000 });
      const redrawn = await page.evaluate((a, b) => a.innerHTML !== b.innerHTML, initialPlot, afterTogglePlot);

      strictEqual(checkboxExists, true, '"gridx" drawing option checkbox not found');
      strictEqual(initalGridXEnabled, false, '"gridx" drawing option should be initially disabled');
      strictEqual(gridXEnabled, true, '"gridx" drawing option should be enabled after toggle');
      strictEqual(redrawn, true, 'JSRoot drawing was not redrawn on object info panel visibility change');
    },
  );

  await testParent.test(
    'should hide the drawing options panel on second click visibility toggle button',
    { timeout },
    async () => {
      await page.click('.visibility-toggle-button');
      await delay(100);
      const exists = await page.evaluate(() => Boolean(document.querySelector('#objectDrawingOptions')));
      strictEqual(exists, false, 'Drawing options panel should be hidden');
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
