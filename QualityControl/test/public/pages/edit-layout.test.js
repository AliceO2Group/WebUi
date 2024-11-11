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
import { defaultMockedLayout, editedMockedLayout } from '../../setup/seeders/layout-show/json-file-mock.js';
export const editLayoutTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test(
    'should load page=layoutView',
    { timeout },
    async () => {
      const LAYOUT_ID = '671b95883d23cd0d67bdc787';
      await page.goto(`${url}?page=layoutShow&layoutId=${LAYOUT_ID}`, { waitUntil: 'networkidle0' });
      const location = await page.evaluate(() => window.location);
      strictEqual(
        location.search,
        `?page=layoutShow&layoutId=${LAYOUT_ID}&tab=main`,
      );
    },
  );

  await testParent.test(
    'should have two options for editing the layout',
    { timeout },
    async () => {
      const editButtonPath = 'header > div > div:nth-child(3) > div > div > button';
      await page.locator(editButtonPath).click();
      const titles = await page.evaluate(() => {
        const firstLinkPath = 'header > div > div:nth-child(3) > div > div > div > p > a:nth-child(1)';
        const secondLinkPath = 'header > div > div:nth-child(3) > div > div > div > p > a:nth-child(2)';
        const firstLinkTitle = document.querySelector(firstLinkPath).title;
        const secondLinkTitle = document.querySelector(secondLinkPath).title;
        return [firstLinkTitle, secondLinkTitle];
      });

      strictEqual(titles[0], 'Edit via GUI');
      strictEqual(titles[1], 'Edit via JSON');
    },
  );

  await testParent.test(
    'should open JSON editor when clicking "Edit via JSON"',
    { timeout },
    async () => {
      const editViaJSONButtonPath = 'header > div > div:nth-child(3) > div > div > div > p > a:nth-child(2)';
      await page.locator(editViaJSONButtonPath).click();
      await delay(50);
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
      strictEqual(result.updateButtonTitle, 'Update template');
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
        let jsonDoesNotContainId = true;
        const json = JSON.parse(textAreaValue);
        jsonDoesNotContainId = !Object.prototype.hasOwnProperty.call(json, 'id');
        return jsonDoesNotContainId;
      });
      strictEqual(result, true);
    },
  );

  await testParent.test(
    'should disable the "Update template" button when JSON has an "id" key and display error message',
    { timeout },
    async () => {
      const mockJSONWithId = '{ "id" : "test" }';
      const expectedErrorMessage =
      'Error: Manual entry of an ID is not allowed, as it is automatically assigned by the system.';

      await checkInvalidJSON(page, mockJSONWithId, expectedErrorMessage);
    },
  );

  await testParent.test(
    'should display error message according to JSON validation and disable the "Update template" button',
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
      const modalElement = await page.$('.o2-modal');
      strictEqual(modalElement, null);
    },
  );

  await testParent.test(
    'should update template when clicking "Update template"',
    { timeout },
    async () => {
      await setNewLayout(page, editedMockedLayout);

      const buttonsPath = 'header > div > div:nth-child(2) > div > button';
      const result = await page.evaluate((buttonsPath) => {
        const buttons = document.querySelectorAll(buttonsPath);
        return buttons.length === 3 && buttons[2].textContent === 'test';
      }, buttonsPath);

      strictEqual(result, true);
      await setNewLayout(page, defaultMockedLayout);
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

const setNewLayout = async (page, newLayout) => {
  const editViaJSONButtonPath = 'header > div > div:nth-child(3) > div > div > div > p > a:nth-child(2)';
  await page.locator(editViaJSONButtonPath).click();
  await delay(50);

  const textareaPath = 'body > div > div > div > div > textarea';
  const mockedJSON = JSON.stringify(newLayout);
  await page.locator(textareaPath).fill(mockedJSON);

  const updateButtonPath = 'body > div > div > div > div > button:nth-child(1)';
  await page.locator(updateButtonPath).click();
  await delay(50);
};
