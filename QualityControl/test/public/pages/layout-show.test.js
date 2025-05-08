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
import { editedMockedLayout } from '../../setup/seeders/layout-show/json-file-mock.js';

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

  await testParent.test('should remove query param only if option is invalid for any filter', { timeout }, async () => {
    const baseParams = `?page=layoutShow&layoutId=${LAYOUT_ID}&tab=main`;

    await page.goto(`${url}${baseParams}&RunType=runType1`, { waitUntil: 'networkidle0' });
    const location1 = await page.evaluate(() => window.location.search);
    strictEqual(location1, `${baseParams}&RunType=runType1`);

    await page.goto(`${url}${baseParams}&RunType=invalid-value`, { waitUntil: 'networkidle0' });
    const location2 = await page.evaluate(() => window.location.search);
    strictEqual(location2, baseParams);
    await delay(100);
  });

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
        throw new Error('#runTypeLayoutFilter not found after 5 seconds');
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
      page.screenshot({ path: 'test2.png' });
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
    'should have two options for editing the layout',
    { timeout },
    async () => {
      const editButtonPath = 'header > div > div:nth-child(3) > div > div > button';
      await page.locator(editButtonPath).click();
      const titles = await page.evaluate(() => {
        const firstLinkPath = 'header > div > div:nth-child(3) > div > div > div > div > a:nth-child(1)';
        const secondLinkPath = 'header > div > div:nth-child(3) > div > div > div > div > a:nth-child(2)';
        const firstLinkTitle = document.querySelector(firstLinkPath).title;
        const secondLinkTitle = document.querySelector(secondLinkPath).title;
        return [firstLinkTitle, secondLinkTitle];
      });

      strictEqual(titles[0], 'Edit via GUI');
      strictEqual(titles[1], 'Edit via JSON');
    },
  );

  await testParent.test(
    'should click the edit button in the header and enter edit mode',
    { timeout },
    async () => {
      const editViaGUIButtonPath = 'header > div > div:nth-child(3) > div > div > div > div > a:nth-child(1)';
      await page.locator(editViaGUIButtonPath).click();
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

  await testParent.test(
    'should open JSON editor when clicking "Edit via JSON"',
    { timeout },
    async () => {
      const editDropdownButtonPath = 'header > div > div:nth-child(3) > div > div > button';
      const editViaJSONButtonPath = 'header > div > div:nth-child(3) > div > div > div > div > a:nth-child(2)';
      await page.locator(editDropdownButtonPath).click();
      await delay(100);
      await page.locator(editViaJSONButtonPath).click();
      await delay(100);
      const result = await page.evaluate(() => {
        const titlePath = 'body > div > div > div > h4';
        const textareaPath = 'body > div > div > div > div > textarea';
        const updateButtonPath = 'body > div > div > div > div > button:nth-child(1)';
        const cancelButtonPath = 'body > div > div > div > div > button:nth-child(2)';
        const title = document.querySelector(titlePath).textContent;
        const textAreaId = document.querySelector(textareaPath).id;
        const updateButtonTitle = document.querySelector(updateButtonPath).textContent;
        const cancelButtonTitle = document.querySelector(cancelButtonPath).textContent;
        return { title, textAreaId, updateButtonTitle, cancelButtonTitle };
      });

      strictEqual(result.title, 'Edit JSON file of a layout');
      strictEqual(result.textAreaId, 'layout-json-editor');
      strictEqual(result.updateButtonTitle, 'Update layout');
      strictEqual(result.cancelButtonTitle, 'Cancel');
    },
  );

  await testParent.test(
    'should not have ID as an editable key in the JSON editor',
    { timeout },
    async () => {
      const result = await page.evaluate(() => {
        const textareaPath = 'body > div > div > div > div > textarea';
        const textAreaValue = document.querySelector(textareaPath).value;
        const json = JSON.parse(textAreaValue);
        const jsonDoesNotContainId = !Object.prototype.hasOwnProperty.call(json, 'id');
        return jsonDoesNotContainId;
      });
      strictEqual(result, true);
    },
  );

  await testParent.test(
    'should disable the "Update layout" button when JSON has an "id" key and display error message',
    { timeout },
    async () => {
      const mockJSONWithId = '{ "id" : "test" }';
      const expectedErrorMessage =
      'Error: Manual entry of an ID is not allowed, as it is automatically assigned by the system.';

      await checkInvalidJSON(page, mockJSONWithId, expectedErrorMessage);
    },
  );

  await testParent.test(
    'should disable the "Update layout" button when JSON is invalid and display error message',
    { timeout },
    async () => {
      const mockJSONInvalid = '{ "name" : "test" ';
      const expectedErrorMessage =
        'Expected \',\' or \'}\' after property value in JSON at position 18 (line 1 column 19)';

      await checkInvalidJSON(page, mockJSONInvalid, expectedErrorMessage);
    },
  );

  await testParent.test(
    'should close JSON editor when clicking "Cancel"',
    { timeout },
    async () => {
      const cancelButtonPath = 'body > div > div > div > div > button:nth-child(2)';
      await page.locator(cancelButtonPath).click();
      await delay(50);
      const childrenCount = await page.evaluate(() => {
        const bodyPath = 'body';
        const body = document.querySelector(bodyPath);
        return body.children.length;
      });
      strictEqual(childrenCount, 2);
    },
  );

  await testParent.test(
    'should update layout when clicking "Update layout"',
    { timeout },
    async () => {
      const pencilButtonPath = 'header > div > div:nth-child(3) > div > div > button';
      await page.locator(pencilButtonPath).click();
      const editViaJSONButtonPath =
        'header > div > div:nth-child(3) > div > div > div > div > a:nth-child(2)';
      page.locator(editViaJSONButtonPath).click();

      const textareaPath = 'body > div > div > div > div > textarea';
      const mockedJSON = JSON.stringify(editedMockedLayout);
      await page.locator(textareaPath).fill(mockedJSON);

      const updateButtonPath = 'body > div > div > div > div > button:nth-child(1)';
      await page.locator(updateButtonPath).click();
      await delay(50);

      const buttonsPath = 'header > div > div:nth-child(2) > div > button';
      const result = await page.evaluate((buttonsPath) => {
        const tabs = document.querySelectorAll(buttonsPath);
        return tabs.length === 3 && tabs[2].textContent === 'test';
      }, buttonsPath);

      strictEqual(result, true);
    },
  );
};

const checkInvalidJSON = async (page, mockedJSON, errorMessage) => {
  const textareaPath = 'body > div > div > div > div > textarea';
  await page.locator(textareaPath).fill(mockedJSON);
  await delay(50);

  const [updateButtonIsDisabled, message] = await page.evaluate(() => {
    const updateButtonPath = 'body > div > div > div > div > button:nth-child(1)';
    const updateButton = document.querySelector(updateButtonPath);
    const errorTextPath = 'body > div:nth-child(1) > div > div > div:nth-child(3)';
    const errorText = document.querySelector(errorTextPath).textContent;
    return [updateButton.disabled, errorText];
  });

  strictEqual(updateButtonIsDisabled, true);
  strictEqual(message, errorMessage);
};
