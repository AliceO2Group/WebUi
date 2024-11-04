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
const OBJECT_VIEW_PAGE_PARAM = '?page=objectView&objectId=123456';

export const objectViewFromLayoutShowTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test(
    'should load page=objectView and display error message & icon due to missing layoutId parameter',
    { timeout },
    async () => {
      await page.goto(`${url}${OBJECT_VIEW_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
      const location = await page.evaluate(() => window.location);
      strictEqual(location.search, OBJECT_VIEW_PAGE_PARAM);

      const errorMessageElement = 'body > div > div:nth-child(2) > span';
      const errorIconElement = 'body > div > div:nth-child(2) > div > svg';

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
    'should take back the user to page=layoutShow when clicking "Back To QCG" (no object passed or selected)',
    { timeout },
    async () => {
      await page.evaluate(() => document.querySelector('div div div div a').click());

      const result = await page.evaluate(() => ({
        location: window.location.search,
        objectSelected: window.model.object.selected,
      }));
      strictEqual(result.location, '?page=objectTree');
      strictEqual(result.objectSelected, null);
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
    'should take back the user to page=layoutShow when clicking "Back to layout"',
    { timeout },
    async () => {
      const layoutId = '671b95883d23cd0d67bdc787';
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => ({
        location: window.location.search,
      }));
      strictEqual(result.location, `?page=layoutShow&layoutId=${layoutId}`);
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
          .querySelector('body > div > div:nth-child(2) > div:nth-child(2) > div > div').classList;
        // const objectSelected = window.model.object.selected;
        return {
          title: title,
          rootPlotClassList: rootPlotClassList,
        //   objectSelected: objectSelected,
        };
      });
      strictEqual(result.title, 'qc/test/object/1 (from layout: a-test)');
      deepStrictEqual(result.rootPlotClassList, { 0: 'relative', 1: 'jsroot-container' });
      //   deepStrictEqual(result.objectSelected, { name: 'qc/test/object/1' });
    },
  );
};
