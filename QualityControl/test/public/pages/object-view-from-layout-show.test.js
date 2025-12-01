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

import { strictEqual, deepStrictEqual, match } from 'node:assert';
import { delay } from '../../testUtils/delay.js';

const OBJECT_VIEW_PAGE_PARAM = '?page=objectView&objectId=123456';

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
          return false;
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
          dlLeftOfDate: dlRect.left > dateRect.right,
          visLeftOfDate: visRect.left > dateRect.right,
          sameY: Math.abs(dateCenter - dlCenter) < 1 && Math.abs(dateCenter - visCenter) < 1,
        };
      });

      if (!positions) {
        throw new Error('One or more elements not found on the page');
      }

      strictEqual(positions.dlLeftOfDate, true, 'Download button is not to the right of the timestamp dropdown');
      strictEqual(positions.visLeftOfDate, true, 'Visibility button is not to the right of the timestamp dropdown');
      strictEqual(
        positions.sameY,
        true,
        'Download button, visibility button, and timestamp dropdown are not vertically aligned within 1px',
      );
    },
  );

  await testParent.test(
    'should have a visible object information panel on page load',
    { timeout },
    async () => {
      /**
       * Gets the visibility of the object information panel
       * @returns {Promise<boolean>} `true` if visible, `false` if hidden
       */
      const getObjectInfoPanelVisibility = async () => await page.evaluate(() => {
        const el = document.querySelector('#ObjectPlot > div:nth-child(2) > div:nth-child(2)');
        if (!el) {
          throw new Error('Object info container not found');
        }
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && parseFloat(style.opacity) > 0 && el.offsetWidth > 0 && el.offsetHeight > 0;
      });

      const isVisible = await getObjectInfoPanelVisibility();

      strictEqual(isVisible, true, 'Object information panel is not visible');
    },
  );

  await testParent.test(
    'should toggle the object information panel visibility when the visibility (toggle) button is clicked',
    { timeout },
    async () => {
      /**
       * Gets the visibility of the object information panel
       * @returns {Promise<boolean>} `true` if visible, `false` if hidden
       */
      const getObjectInfoPanelVisibility = async () => await page.evaluate(() => {
        const el = document.querySelector('#ObjectPlot > div:nth-child(2) > div:nth-child(2)');
        if (!el) {
          // Object is not loaded in the DOM
          return false;
        }
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && parseFloat(style.opacity) > 0 && el.offsetWidth > 0 && el.offsetHeight > 0;
      });

      // Capture initial visibility state
      const initialVisibility = await getObjectInfoPanelVisibility();

      // Click the toggle button once and check visibility
      await page.click('.visibility-toggle-button');
      await delay(100);
      const afterFirstClick = await getObjectInfoPanelVisibility();

      // Click the toggle button again to restore original state
      await page.click('.visibility-toggle-button');
      await delay(100);
      const afterSecondClick = await getObjectInfoPanelVisibility();

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
      /**
       * Get the object info element
       * @returns {Promise<Element>} The object information panel element
       */
      const getObjectPanelElement = async () => {
        const el = await page.evaluateHandle(() =>
          document.querySelector('#ObjectPlot > div:nth-child(2) > div > div'));
        if (!el) {
          throw new Error('Object info container not found');
        }
        return el;
      };

      const initialElement = await getObjectPanelElement();

      await page.click('.visibility-toggle-button');
      await delay(100);

      const newElement = await getObjectPanelElement();

      // Confirm that the DOM node is different
      const redrawn = await page.evaluate((a, b) => a !== b, initialElement, newElement);

      strictEqual(redrawn, true, 'JSRoot drawing was not redrawn on visibility toggle');
    },
  );

  await testParent.test(
    'should display an error when the JSROOT object fails to fetch due to a network failure',
    { timeout: 10000 },
    async () => {
      // Enable request interception for this test
      await page.setRequestInterception(true);

      // Define request handler scoped to this test
      const requestHandler = (interceptedRequest) => {
        const url = interceptedRequest.url();

        // Abort only the API request for JSRoot object
        if (url.includes('/api/object')) {
          interceptedRequest.abort('failed'); // simulates network failure
        } else {
          interceptedRequest.continue();
        }
      };

      try {
        // Attach the handler
        page.on('request', requestHandler);

        await page.reload({ waitUntil: 'networkidle0' });
        await delay(1000);

        const errorText = await page.evaluate(() => document.querySelector('#Error .f3').innerText);

        strictEqual(errorText, 'Connection to server failed, please try again');
      } finally {
        // Cleanup: remove listener and disable interception
        page.off('request', requestHandler);
        await page.setRequestInterception(false);
      }
    },
  );
};
