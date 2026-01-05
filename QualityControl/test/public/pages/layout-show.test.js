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
import { getElementCenter } from '../../testUtils/dragAndDrop.js';

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
    'should have a correctly made download button',
    { timeout },
    async () => {
      const objectId = '016fa8ac-f3b6-11ec-b9a9-c0a80209250c';
      const dlButton = await page.evaluate(() => document.querySelector('.download-button').href);
      const token = await page.evaluate(() => model.session.token);
      strictEqual(dlButton, `${url}api/object/proxy/download/?token=${token}&objectIds=${objectId}`);
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
      const selectorId = '#runTypeFilter';

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
        throw new Error('#runTypeFilter not found after 5 seconds');
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
      const commonSelectorPath = 'section > div > div > div > div:nth-child(2) > div > div';
      const plot1Path = `${commonSelectorPath} > div:nth-child(1)`;
      await page.locator(plot1Path).click();

      const result = await page.evaluate((commonSelectorPath) => {
        const { title } = document.querySelector(`${commonSelectorPath} > div:nth-child(2) > div > button`);
        const infoCommonSelectorPath = `${commonSelectorPath} > div:nth-child(2) > div > div > div > div`;
        const objectPath = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > div`).innerText;
        const pathTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > b`).innerText;
        const lastModifiedTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(6) > b`).innerText;
        return { title, pathTitle, objectPath, lastModifiedTitle };
      }, commonSelectorPath);
      strictEqual(result.title, 'View details about histogram');
      strictEqual(result.pathTitle, 'Path');
      strictEqual(result.objectPath, 'qc/test/object/1');
      strictEqual(result.lastModifiedTitle, 'Last Modified');
    });

  await testParent.test(
    'should have an info button with full path and last modified when clicked on a second plot(plot success)',
    { timeout },
    async () => {
      const commonSelectorPath = '#subcanvas > div:nth-child(2) > div > div';
      const plot2Path = `${commonSelectorPath} > div:nth-child(1)`;
      await page.locator(plot2Path).click();
      const result = await page.evaluate((commonSelectorPath) => {
        const { title } = document.querySelector(`${commonSelectorPath} > div:nth-child(2) > div > button`);
        const infoCommonSelectorPath = `${commonSelectorPath} > div:nth-child(2) > div > div > div > div`;
        const objectPath = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > div`).innerText;
        const pathTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(1) > b`).innerText;
        const lastModifiedTitle = document.querySelector(`${infoCommonSelectorPath} > div:nth-child(6) > b`).innerText;
        return { title, pathTitle, objectPath, lastModifiedTitle };
      }, commonSelectorPath);
      strictEqual(result.title, 'View details about histogram');
      strictEqual(result.pathTitle, 'Path');
      strictEqual(result.objectPath, 'qc/test/object/1');
      strictEqual(result.lastModifiedTitle, 'Last Modified');
    },
  );

  await testParent.test(
    'should align info dropdown to the right when container is on the left',
    { timeout },
    async () => {
      await page.click('button.btn[title*="View details"]');
      const leftStyle = await page.evaluate(() => document.querySelector('#subcanvas .dropdown-menu').style.left);

      strictEqual(leftStyle, '0.1em');
    }
  );

  await testParent.test('should have second tab to be empty (according to demo data)', { timeout }, async () => {
    await page.locator('#tab-1').click();
    await delay(50);
    const plotPath = 'section svg.jsroot';
    const plotsCount = await page.evaluate((plotPath) => document.querySelectorAll(plotPath).length, plotPath);
    strictEqual(plotsCount, 0);
  });

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
      const buttonPath = '.btn-group > button:nth-child(1)';
      const duplicateButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(duplicateButton, 'Duplicate layout');
    },
  );

  await testParent.test(
    'should have one delete button in the header to delete layout',
    { timeout },
    async () => {
      const buttonPath = '.btn-group > button:nth-of-type(2)';
      const deleteButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(deleteButton, 'Delete layout');
    },
  );

  await testParent.test(
    'should have one link button in the header to download layout skeleton',
    { timeout },
    async () => {
      const buttonPath = '.btn-group > a';
      const editButton = await page.evaluate((buttonPath) => document.querySelector(buttonPath).title, buttonPath);
      strictEqual(editButton, 'Export layout skeleton as JSON file');
    },
  );

  await testParent.test(
    'should have two options for editing the layout',
    { timeout },
    async () => {
      const editButtonPath = '.btn-group > div > button';
      await page.locator(editButtonPath).click();
      const titles = await page.evaluate(() => {
        const firstLinkPath = '#editByGui';
        const secondLinkPath = '#editByJson';
        const firstLinkTitle = document.querySelector(firstLinkPath).title;
        const secondLinkTitle = document.querySelector(secondLinkPath).title;
        return [firstLinkTitle, secondLinkTitle];
      });

      strictEqual(titles[0], 'Edit via GUI');
      strictEqual(titles[1], 'Edit via JSON');
    },
  );

  await testParent.test(
    'should enter edit mode and remove filters if there are any applied',
    { timeout },
    async () => {
      const editViaGUIButtonPath = '#editByGui';
      const filterPanel = await page.evaluate(() => document.querySelector('#filterElement'));
      ok(filterPanel);
      await page.locator('#runNumberFilter').fill('100000');
      await page.locator('#triggerFilterButton').click();
      await delay(100);
      let location = await page.evaluate(() => window.location);
      ok(location.search.includes('RunNumber=100000'));
      await page.locator(editViaGUIButtonPath).click();
      await delay(100);
      location = await page.evaluate(() => window.location);
      ok(!location.search.includes('RunNumber=100000'));
      const filterElement = await page.evaluate(() => document.querySelector('#filterElement'));
      strictEqual(filterElement, null);
    },
  );

  await testParent.test(
    'should have input field for changing layout name in edit mode',
    { timeout },
    async () => {
      const inputPath = 'header > div > div > div:nth-child(3) > input';
      await page.evaluate((inputPath) => document.querySelector(inputPath), inputPath);
    },
  );

  await testParent.test(
    'should not allow user to change the auto tab change value to a value if it is not bigger than 10',
    { timeout },
    async () => {
      const result = await setAutoTabChangeValue(page, 9);
      ok(result, 0);
    },
  );

  await testParent.test(
    'should allow user to change the auto tab change value to a value if bigger than 10',
    { timeout },
    async () => {
      const result = await setAutoTabChangeValue(page, 11);
      ok(result, 11);
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
    'should reorder tabs via drag and drop in edit mode',
    { timeout },
    async () => {
      const originalTabNames = await page.$$eval('#btn-tab', (elements) =>
        elements.map((element) => element.textContent.trim()));

      const sourceTabSelector = '.btn-group.flex-fixed.relative:nth-child(1)';
      const targetZoneSelector = '.btn-group.flex-fixed.relative:nth-child(2) .drop-zone.after';

      const sourceCenter = await getElementCenter(page, sourceTabSelector);
      const targetCenter = await getElementCenter(page, targetZoneSelector);

      await page.mouse.move(sourceCenter.x, sourceCenter.y);
      await page.mouse.down();

      // We add 'steps' to make the move smoother, which helps trigger event
      await page.mouse.move(targetCenter.x, targetCenter.y, { steps: 10 });

      await delay(1000);

      // Wait a moment for the 'active' class to appear in the UI
      await page.waitForSelector('.drop-zone.after.active');

      await page.mouse.up();

      const tabNames = await page.$$eval('#btn-tab', (elements) =>
        elements.map((element) => element.textContent.trim()));

      strictEqual(tabNames[1], originalTabNames[0]);
    }
  );

  await testParent.test(
    'should show normal sidebar after Cancel click',
    { timeout },
    async () => {
      const cancelButtonPath = '#cancel-button';
      await page.locator(cancelButtonPath).click();
      await page.waitForSelector('nav .menu-title', { timeout: 5000 });
    },
  );

  await testParent.test(
    'should open JSON editor when clicking "Edit via JSON"',
    { timeout },
    async () => {
      const editDropdownButtonPath = '.btn-group > div > button';
      const editViaJSONButtonPath =
        '#editByJson';
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
    { timeout: 50000 },
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
      const pencilButtonPath = '.btn-group > div > button';
      await page.locator(pencilButtonPath).click();

      const editViaJSONButtonPath = '#editByJson';
      await page.locator(editViaJSONButtonPath).click();

      const textareaPath = '#layout-json-editor';
      const mockedJSON = JSON.stringify(editedMockedLayout);
      await page.locator(textareaPath).fill(mockedJSON);

      const updateButtonPath = '#updateLayoutButton';
      await page.locator(updateButtonPath).click();

      await delay(50);

      const newTabName = await page.evaluate(() => {
        const tab = document.querySelector('#tab-2');
        return tab.textContent;
      });
      strictEqual(newTabName, 'test');
    },
  );

  await testParent.test('should change tab after set tabInterval', { timeout: 15000 }, async () => {
    const location = await page.evaluate(() => window.location);
    strictEqual(location.search, `?page=layoutShow&layoutId=${LAYOUT_ID}&tab=a`);
    await delay(11000);
    const location2 = await page.evaluate(() => window.location);
    strictEqual(location2.search, `?page=layoutShow&layoutId=${LAYOUT_ID}&tab=test`);
  });

  await testParent.test(
    'should update layout name in sidebar when name is changed and saved via JSON editor',
    { timeout },
    async () => {
      const originalSidebarName = await page.evaluate(() => {
        const sidebarLayoutLink = document.querySelector('nav a.menu-item.w-wrapped.selected span:nth-child(2)');
        return sidebarLayoutLink ? sidebarLayoutLink.textContent.trim() : null;
      });

      const editDropdownButtonPath = '.btn-group > div > button';
      await page.locator(editDropdownButtonPath).click();
      await delay(100);

      const editViaJSONButtonPath = '#editByJson';
      await page.locator(editViaJSONButtonPath).click();
      await delay(100);

      const currentJSON = await page.evaluate(() => {
        const textareaPath = 'body > div > div > div > div > textarea';
        return document.querySelector(textareaPath).value;
      });

      const layoutData = JSON.parse(currentJSON);
      const newLayoutName = 'Updated Layout Name Test';
      layoutData.name = newLayoutName;

      const textareaPath = '#layout-json-editor';
      await page.locator(textareaPath).fill(JSON.stringify(layoutData));

      const updateButtonPath = '#updateLayoutButton';
      await page.locator(updateButtonPath).click();
      await delay(200);

      const updatedSidebarName = await page.evaluate(() => {
        const sidebarLayoutLink = document.querySelector('nav a.menu-item.w-wrapped.selected span:nth-child(2)');
        return sidebarLayoutLink ? sidebarLayoutLink.textContent.trim() : null;
      });

      strictEqual(updatedSidebarName, newLayoutName);
      ok(originalSidebarName !== updatedSidebarName, 'Sidebar name should have changed from original');
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

/**
 * Fills the input for tab change timer and returns the resulting value.
 * @param page - The Playwright page instance.
 * @param value - The value to fill into the input field.
 * @returns The numeric value from the input after filling it.
 */
async function setAutoTabChangeValue(page, value) {
  const inputSelector = '#inputChangeTabTimer';
  await page.locator(inputSelector).fill(value.toString());
  return await page.evaluate(
    (selector) => parseInt(document.querySelector(selector).value, 10),
    inputSelector,
  );
}
