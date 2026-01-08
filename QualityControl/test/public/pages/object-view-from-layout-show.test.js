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

import { strictEqual, deepStrictEqual, match, ok } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { StorageKeysEnum } from '../../../public/common/enums/storageKeys.enum.js';
import {
  setLocalStorage,
  getLocalStorageAsJson,
  removeLocalStorage,
  setLocalStorageAsJson,
} from '../../testUtils/localStorage.js';
import { SUPPORTED_ROOT_IMAGE_FILE_TYPES } from '../../../public/common/enums/rootImageMimes.enum.js';

const OBJECT_VIEW_PAGE_PARAM = '?page=objectView&objectId=123456';

/**
 * Gets the visibility of the object information panel.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @returns {Promise<boolean>} `true` if the element exists, `false` if it doesn't.
 */
const getObjectInfoPanelVisibility = async (page) => {
  try {
    // `Boolean()` ensures the function returns true/false instead of an ElementHandle object,
    // converting the resolved ElementHandle (truthy) to true
    return Boolean(await page.waitForSelector('#ObjectPlot > div:nth-child(2) > div:nth-child(2)', { timeout: 100 }));
  } catch {
    // If the `element` for the `selector` doesn't appear, the function will throw an error.
    return false;
  }
};

export const objectViewFromLayoutShowTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test(
    'should load page=objectView and display error message & icon due to missing layoutId parameter',
    { timeout },
    async () => {
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
    },
  );

  await testParent.test(
    'should load a plot and update button text to "Back to layout" if layoutId parameter is provided',
    { timeout },
    async () => {
      const objectId = '6724a6bd1b2bad3d713cc4ee';
      const layoutId = '671b95883d23cd0d67bdc787';
      await page
        .goto(`${url}?page=objectView&objectId=${objectId}&layoutId=${layoutId}`, { waitUntil: 'networkidle0' });

      const result = await page.evaluate(() => {
        const backButtonTitle = document.querySelector('div div div div a').title;
        return {
          location: window.location.search,
          backButtonTitle: backButtonTitle,
        };
      });
      strictEqual(
        result.location,
        '?page=objectView&objectId=6724a6bd1b2bad3d713cc4ee&layoutId=671b95883d23cd0d67bdc787',
      );
      strictEqual(result.backButtonTitle, 'Back to layout');
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

  await testParent.test(
    'should have a correctly made save root as image button',
    { timeout },
    async () => {
      const exists = await page.evaluate(() => document.querySelector('.save-root-as-image-button') !== null);

      ok(exists, 'Expected ROOT image save button to exist');
    },
  );

  await testParent.test(
    'save root as image dropdown should have the correct filetype options',
    { timeout },
    async () => {
      const FILENAME = 'qc/test/object/1';

      await page.locator('.save-root-as-image-button').click();
      await page.waitForSelector('.popover', {
        visible: true,
        timeout: 1000,
      });

      const expectedExtensionTypes = Object.keys(Object.entries(SUPPORTED_ROOT_IMAGE_FILE_TYPES).reduce(
        (acc, [key, value]) => {
          if (!acc.seen.has(value)) {
            acc.seen.add(value);
            acc.result[key] = value;
          }
          return acc;
        },
        { seen: new Set(), result: {} },
      ).result);

      const testedOptions = await page.evaluate(() =>
        Array.from(document.querySelectorAll('.popover .dropdown > button')).map((buttonElement) => buttonElement.id));
      const expectedOptions = expectedExtensionTypes.map((filetype) => `${FILENAME}.${filetype}`);
      deepStrictEqual(
        testedOptions,
        expectedOptions,
        `Save options ${JSON.stringify(testedOptions)} should be ${JSON.stringify(expectedOptions)}`,
      );
    },
  );

  await testParent.test(
    'should take back the user to page=layoutShow when clicking "Back to layout"',
    { timeout },
    async () => {
      const layoutId = '671b95883d23cd0d67bdc787';
      const backToLayoutButtonPath = 'div > div > div > div > a';
      const href = await page.evaluate((backToLayoutButtonPath) =>
        document.querySelector(backToLayoutButtonPath).href, backToLayoutButtonPath);
      strictEqual(true, href.includes('&tab=main'));
      await page.locator(backToLayoutButtonPath).click();

      await delay(500);
      const location = await page.evaluate(() => window.location);
      strictEqual(location.search, `?page=layoutShow&layoutId=${layoutId}&tab=main`);
    },
  );

  await testParent.test(
    'should load page=objectView and display a plot when objectId and layoutId are passed',
    { timeout },
    async () => {
      const objectId = '6724a6bd1b2bad3d713cc4ee';
      const layoutId = '671b95883d23cd0d67bdc787';
      await page.goto(
        `${url}?page=objectView&objectId=${objectId}&layoutId=${layoutId}`,
        { waitUntil: 'networkidle0' },
      );
      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').textContent;
        const rootPlotClassList = document
          .querySelector('#ObjectPlot > div:nth-child(2) > div:nth-child(1) > div').classList;
        const selectedObjectPath = window.model.objectViewModel.selected.payload.path;
        return {
          title, rootPlotClassList, selectedObjectPath,
        };
      });
      strictEqual(result.title, 'qc/test/object/1 (from layout: a-test)');
      deepStrictEqual(result.rootPlotClassList, { 0: 'relative', 1: 'jsroot-container' });
      strictEqual(result.selectedObjectPath, 'qc/test/object/1');
    },
  );

  await testParent.test(
    'should have a correctly made object info visibility button',
    { timeout },
    async () => {
      const visibilityButtonClass = await page.evaluate(() =>
        document.querySelector('.visibility-toggle-button').className);
      match(visibilityButtonClass, /visibility-toggle-(on|off)/i);
    },
  );

  await testParent.test(
    'should have download button and visibility button inline and to the right of the timestamp dropdown',
    { timeout },
    async () => {
      const positions = await page.evaluate(() => {
        const dateSelector = document.querySelector('#dateSelector');
        const dlButton = document.querySelector('.download-button');
        const visibilityButton = document.querySelector('.visibility-toggle-button');

        if (!dateSelector || !dlButton || !visibilityButton) {
          throw new Error('One or more elements not found on the page');
        }

        const dateRect = dateSelector.getBoundingClientRect();
        const dlRect = dlButton.getBoundingClientRect();
        const visRect = visibilityButton.getBoundingClientRect();

        // Helper to get vertical center
        const verticalCenter = (rect) => (rect.top + rect.bottom) / 2;

        const dateCenter = verticalCenter(dateRect);
        const dlCenter = verticalCenter(dlRect);
        const visCenter = verticalCenter(visRect);

        return {
          dlRightOfDate: dlRect.left > dateRect.right,
          visRightOfDate: visRect.left > dateRect.right,
          sameY: Math.abs(dateCenter - dlCenter) < 1 && Math.abs(dateCenter - visCenter) < 1,
        };
      });

      strictEqual(positions.dlRightOfDate, true, 'Download button is not to the right of the timestamp dropdown');
      strictEqual(positions.visRightOfDate, true, 'Visibility button is not to the right of the timestamp dropdown');
      strictEqual(
        positions.sameY,
        true,
        'Download button, visibility button, and timestamp dropdown are not vertically aligned within 1px',
      );
    },
  );

  await testParent.test(
    'should show the object information panel on reload when no storage key exists',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKey = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;

      await removeLocalStorage(page, localStorageKey);
      await page.reload({ waitUntil: 'networkidle0' });

      const domVisibility = await getObjectInfoPanelVisibility(page);
      const storedVisibility = await getLocalStorageAsJson(page, localStorageKey);

      strictEqual(storedVisibility, null, 'Expected visibility setting to be null when key is missing');
      strictEqual(domVisibility, true, 'DOM should show the panel when key is missing');
    },
  );

  await testParent.test(
    'should show the object information panel on reload when storage key is set to true',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKey = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;

      await setLocalStorageAsJson(page, localStorageKey, true);
      await page.reload({ waitUntil: 'networkidle0' });

      const domVisibility = await getObjectInfoPanelVisibility(page);
      const storedVisibility = await getLocalStorageAsJson(page, localStorageKey);

      strictEqual(storedVisibility, true, 'Expected storage visibility to be true');
      strictEqual(domVisibility, true, 'DOM should show the panel when storage is true');
    },
  );

  await testParent.test(
    'should hide the object information panel on reload when storage key is set to false',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKey = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;

      await setLocalStorageAsJson(page, localStorageKey, false);
      await page.reload({ waitUntil: 'networkidle0' });

      const domVisibility = await getObjectInfoPanelVisibility(page);
      const storedVisibility = await getLocalStorageAsJson(page, localStorageKey);

      strictEqual(storedVisibility, false, 'Expected storage visibility to be false');
      strictEqual(domVisibility, false, 'DOM should hide the panel when storage is false');
    },
  );

  await testParent.test(
    'should maintain independent object information panel visibility on reload for different users',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKeyMainUser = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;
      const localStorageKeyDiffUser = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId + 1}`;

      await setLocalStorageAsJson(page, localStorageKeyMainUser, true); // show panel main user
      await setLocalStorageAsJson(page, localStorageKeyDiffUser, false); // hide panel diff user

      await page.reload({ waitUntil: 'networkidle0' });

      const mainUserVisibilitySetting = await getLocalStorageAsJson(page, localStorageKeyMainUser);
      const mainUserVisibilityPanelElement = await getObjectInfoPanelVisibility(page);
      const diffUserVisibilitySetting = await getLocalStorageAsJson(page, localStorageKeyDiffUser);

      strictEqual(mainUserVisibilitySetting, true, 'Main user object info panel setting should remain visible');
      strictEqual(mainUserVisibilityPanelElement, true, 'Main user object info panel element should remain visible');
      strictEqual(diffUserVisibilitySetting, false, 'Different user object info panel setting should remain hidden');
    },
  );

  await testParent.test(
    'should fallback to default object information panel visibility when storage key is set to an invalid value',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKey = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;

      // Set an invalid value in localStorage
      await setLocalStorage(page, localStorageKey, 'invalid-json-value');
      await page.reload({ waitUntil: 'networkidle0' });

      // Check the stored value as parsed by our getter
      const storedVisibility = await getLocalStorageAsJson(page, localStorageKey);
      // Check the actual DOM visibility
      const domVisibility = await getObjectInfoPanelVisibility(page);

      strictEqual(
        storedVisibility,
        null,
        'Expected fallback visibility to be null when key contains an invalid value',
      );
      strictEqual(
        domVisibility,
        true,
        'DOM should show the object information panel when storage key is invalid',
      );
    },
  );

  await testParent.test(
    'should toggle the object information panel visibility when the visibility (toggle) button is clicked',
    { timeout },
    async () => {
      // Capture initial visibility state
      const initialVisibility = await getObjectInfoPanelVisibility(page);

      // Click the toggle button once and check visibility
      await page.click('.visibility-toggle-button');
      await delay(100);
      const afterFirstClick = await getObjectInfoPanelVisibility(page);

      // Click the toggle button again to restore original state
      await page.click('.visibility-toggle-button');
      await delay(100);
      const afterSecondClick = await getObjectInfoPanelVisibility(page);

      strictEqual(
        afterFirstClick,
        !initialVisibility,
        'Object information panel should toggle to the opposite state after the first click',
      );
      strictEqual(
        afterSecondClick,
        initialVisibility,
        'Object information panel should return to its original state after the second click',
      );
    },
  );

  await testParent.test(
    'should redraw the JSRoot object drawing when visibility toggle changes',
    { timeout },
    async () => {
      const initialElement = await page.waitForSelector(
        '#ObjectPlot > div:nth-child(2) > div > div',
        { timeout: 1000 },
      );

      await page.click('.visibility-toggle-button');
      await delay(100);

      const newElement = await page.waitForSelector(
        '#ObjectPlot > div:nth-child(2) > div > div',
        { timeout: 1000 },
      );

      const redrawn = await page.evaluate((a, b) => a.innerHTML !== b.innerHTML, initialElement, newElement);

      strictEqual(redrawn, true, 'JSRoot drawing was not redrawn on visibility toggle');
    },
  );

  await testParent.test(
    'should update localStorage state when visibility toggle button is clicked',
    { timeout },
    async () => {
      const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
      if (!personId) {
        throw new Error('Could not resolve personId from the application model');
      }

      const localStorageKey = `${StorageKeysEnum.OBJECT_VIEW_INFO_VISIBILITY_SETTING}-${personId}`;
      const visibilitySettingInitially = await getLocalStorageAsJson(page, localStorageKey);

      // Click the toggle button (first time)
      await page.click('.visibility-toggle-button');
      await delay(100);
      const visibilitySettingAfterFirstClick = await getLocalStorageAsJson(page, localStorageKey);

      // Click the toggle button (second time)
      await page.click('.visibility-toggle-button');
      await delay(100);
      const visibilitySettingAfterSecondClick = await getLocalStorageAsJson(page, localStorageKey);

      strictEqual(
        visibilitySettingAfterFirstClick,
        !visibilitySettingInitially,
        'LocalStorage state should be toggled after the first click',
      );
      strictEqual(
        visibilitySettingAfterSecondClick,
        visibilitySettingInitially,
        'LocalStorage state should return to the initial value after the second click',
      );
    },
  );

  await testParent.test(
    'should display an error when the JSROOT object fails to fetch due to a network failure',
    { timeout },
    async () => {
      const requestHandler = (interceptedRequest) => {
        const url = interceptedRequest.url();

        if (url.includes('/api/object')) {
          interceptedRequest.abort('failed'); // simulates network failure
        } else {
          interceptedRequest.continue();
        }
      };

      try {
        // Enable interception and attach the handler
        await page.setRequestInterception(true);
        page.on('request', requestHandler);

        await page.reload({ waitUntil: 'networkidle0' });
        await delay(100);

        const errorText = await page.evaluate(() => document.querySelector('#Error .f3')?.innerText);

        strictEqual(errorText, 'Connection to server failed, please try again');
      } catch (error) {
        // Test failed
        strictEqual(1, 0, error.message);
      } finally {
        // Cleanup: remove listener and disable interception
        page.off('request', requestHandler);
        await page.setRequestInterception(false);
      }
    },
  );

  await testParent.test(
    'should display an error when the JSROOT object fails to fetch due to a backend failure',
    { timeout },
    async () => {
      const requestHandler = (interceptedRequest) => {
        const url = interceptedRequest.url();

        if (url.includes('/api/object')) {
          // Respond with a backend error
          interceptedRequest.respond({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({
              message: 'JSROOT failed to open file \'url\'',
            }),
          });
        } else {
          interceptedRequest.continue();
        }
      };

      try {
        // Enable interception and attach the handler
        await page.setRequestInterception(true);
        page.on('request', requestHandler);

        await page.reload({ waitUntil: 'networkidle0' });
        await delay(100);

        const errorText = await page.evaluate(() => document.querySelector('#Error .f3')?.innerText);

        strictEqual(
          errorText,
          'Request to server failed (500 Internal Server Error): JSROOT failed to open file \'url\'',
        );
      } catch (error) {
        // Test failed
        strictEqual(1, 0, error.message);
      } finally {
        // Cleanup: remove listener and disable interception
        page.off('request', requestHandler);
        await page.setRequestInterception(false);
      }
    },
  );
};
