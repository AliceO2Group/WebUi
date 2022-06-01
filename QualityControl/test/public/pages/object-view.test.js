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
/* eslint-disable max-len */

const assert = require('assert');
const test = require('../mocha-index');

describe('objectTree page test suite', async () => {
  let page, url;

  before(async () => {
    page = test.page;
    url = test.url;
  });

  describe('objectView called from objectTree', () => {
    it('should load page=objectView and display error message & icon due to missing objectName parameter', async () => {
      await page.goto(url + '?page=objectView', {waitUntil: 'networkidle0'});
      const result = await page.evaluate(() => {
        const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
        const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
        const backButtonTitle = document.querySelector('div div div a').title;

        return {
          location: window.location,
          message: errorMessage,
          iconClassList: iconClassList,
          backButtonTitle: backButtonTitle
        };
      });
      assert.strictEqual(result.location.search, '?page=objectView');
      assert.strictEqual(result.message, 'No object name or object ID were provided');
      assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
      assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
    });

    it('should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)', async () => {
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
          objectSelected: window.model.object.selected
        };
      });
      assert.strictEqual(result.location, '?page=objectTree');
      assert.strictEqual(result.objectSelected, null);
    });

    // it('should load page=objectView and display an error message when a parameter objectName is passed but object not found', async () => {
    //   const objectName = 'NOT_FOUND_OBJECT';
    // TODO add back 
    //   await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});
    //   const result = await page.evaluate(() => {
    //     const title = document.querySelector('body > div > div:nth-child(2) > div > div > span').textContent;
    //     return {
    //       title: title,
    //     };
    //   });
    //   await page.waitForTimeout(20000)
    //   assert.strictEqual(result.title, 'Object NOT_FOUND_OBJECT could not be loaded');
    // });

    it('should load page=objectView and display a plot when a parameter objectName is passed', async () => {
      const objectName = 'DAQ01/EquipmentSize/CPV/CPV';
      await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});
      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').innerText;
        const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
        const objectSelected = window.model.object.selected;
        return {
          title: title,
          rootPlotClassList: rootPlotClassList,
          objectSelected: objectSelected
        };
      });
      assert.strictEqual(result.title, objectName);
      assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'jsroot-container'});
      assert.deepStrictEqual(result.objectSelected, {name: objectName, createTime: 3, lastModified: 100});
    });

    it('should have an info button with full path and last modified when clicked (plot success)', async () => {
      await page.evaluate(() => document.querySelector('body > div > div > div:nth-child(3) > div > div > button').click());

      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector('body > div > div > div:nth-child(3) > div > div > button').title;
        const fullPath = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div').innerText;
        const lastModified = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div:nth-child(2)').innerText;
        return {
          title: infoButtonTitle,
          fullPath: fullPath,
          lastModified: lastModified,
        };
      });
      assert.strictEqual(result.title, 'View details about histogram');
      assert.ok(result.fullPath.includes('PATH'));
      assert.ok(result.fullPath.includes('DAQ01/EquipmentSize/CPV/CPV'));
      assert.ok(result.lastModified.includes('LAST MODIFIED'));
    });

    it('should load page=objectView and display a Checker Object when a parameter objectName is passed', async () => {
      const objectName = 'qcg/checker/AB';
      await page.goto(url + `?page=objectView&objectName=${objectName}`, {waitUntil: 'networkidle0'});

      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').textContent;
        const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
        const objectSelected = window.model.object.selected;
        return {
          title: title,
          rootPlotClassList: rootPlotClassList,
          objectSelected: objectSelected
        };
      });
      assert.strictEqual(result.title, objectName);
      // TODO assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'p2', 2: 'flex-column', 3: 'scroll-y'});
      assert.deepStrictEqual(result.objectSelected, {name: objectName, createTime: 2, lastModified: 100});
      // TODO ADD Version back
    });
  });

  describe('objectView called from layoutShow', () => {
    it('should load page=objectView and display error message & icon due to missing objectID parameter', async () => {
      await page.goto(url + '?page=objectView', {waitUntil: 'networkidle0'});
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => {
        const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
        const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
        const backButtonTitle = document.querySelector('div div div a').title;

        return {
          location: window.location,
          message: errorMessage,
          iconClassList: iconClassList,
          backButtonTitle: backButtonTitle
        };
      });
      assert.strictEqual(result.location.search, '?page=objectView');
      assert.strictEqual(result.message, 'No object name or object ID were provided');
      assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
      assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
    });

    it('should load page=objectView and display error message & icon due to missing layoutId parameter', async () => {
      await page.goto(url + '?page=objectView&objectId=123456', {waitUntil: 'networkidle0'});
      const result = await page.evaluate(() => {
        const errorMessage = document.querySelector('body > div > div:nth-child(2) > div > span').textContent;
        const iconClassList = document.querySelector('div div:nth-child(2) div svg').classList;
        const backButtonTitle = document.querySelector('div div div a').title;

        return {
          location: window.location,
          message: errorMessage,
          iconClassList: iconClassList,
          backButtonTitle: backButtonTitle
        };
      });
      assert.strictEqual(result.location.search, '?page=objectView&objectId=123456');
      assert.strictEqual(result.message, 'No layout ID was provided');
      assert.deepStrictEqual(result.iconClassList, {0: 'icon', 1: 'fill-primary'});
      assert.strictEqual(result.backButtonTitle, 'Go back to all objects');
    });

    it('should take back the user to page=objectTree when clicking "Back To QCG" (no object passed or selected)', async () => {
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
          objectSelected: window.model.object.selected
        };
      });
      assert.strictEqual(result.location, '?page=objectTree');
      assert.strictEqual(result.objectSelected, null);
    });

    it('should load a plot and update button text to "Go back to layout" if layoutId parameter is provided', async () => {
      const objectId = '5aba4a059b755d517e76ef54';
      const layoutId = '5aba4a059b755d517e76ea10';
      await page.goto(url + `?page=objectView&objectId=${objectId}&layoutId=${layoutId}`, {waitUntil: 'networkidle0'});

      const result = await page.evaluate(() => {
        const backButtonTitle = document.querySelector('div div div a').title;
        return {
          location: window.location.search,
          backButtonTitle: backButtonTitle
        };
      });
      assert.strictEqual(result.location, `?page=objectView&objectId=5aba4a059b755d517e76ef54&layoutId=5aba4a059b755d517e76ea10`);
      assert.strictEqual(result.backButtonTitle, 'Go back to layout');
    });

    it('should take back the user to page=layoutShow when clicking "Go back to layout"', async () => {
      const layoutId = '5aba4a059b755d517e76ea10';
      await page.evaluate(() => document.querySelector('div div div a').click());

      const result = await page.evaluate(() => {
        return {
          location: window.location.search,
        };
      });
      assert.strictEqual(result.location, `?page=layoutShow&layoutId=${layoutId}`);
    });

    it('should load page=objectView and display a plot when objectId and layoutId are passed', async () => {
      const objectId = '5aba4a059b755d517e76ef54';
      const layoutId = '5aba4a059b755d517e76ea10';
      await page.goto(url + `?page=objectView&objectId=${objectId}&layoutId=${layoutId}`, {waitUntil: 'networkidle0'});
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => {
        const title = document.querySelector('div div b').textContent;
        const rootPlotClassList = document.querySelector('body > div > div:nth-child(2) > div > div').classList;
        const objectSelected = window.model.object.selected;
        return {
          title: title,
          rootPlotClassList: rootPlotClassList,
          objectSelected: objectSelected
        };
      });
      await page.waitForTimeout(7000);
      assert.strictEqual(result.title, 'DAQ01/EquipmentSize/CPV/CPV(AliRoot)');
      assert.deepStrictEqual(result.rootPlotClassList, {0: 'relative', 1: 'jsroot-container'});
      assert.deepStrictEqual(result.objectSelected, {name: 'DAQ01/EquipmentSize/CPV/CPV', createTime: 3, lastModified: 100});
      // TODO Add version back
    });

    it('should have an info button with full path and last modified when clicked (plot success)', async () => {
      await page.evaluate(() => document.querySelector('body > div > div > div:nth-child(3) > div > div > button').click());
      const result = await page.evaluate(() => {
        const infoButtonTitle = document.querySelector('body > div > div > div:nth-child(3) > div > div > button').title;
        const fullPath = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div').innerText;
        const lastModified = document.querySelector('body > div > div > div:nth-child(3) > div > div > div > div:nth-child(2)').innerText;
        return {
          title: infoButtonTitle,
          fullPath: fullPath,
          lastModified: lastModified,
        };
      });
      await page.waitForTimeout(200);
      assert.strictEqual(result.title, 'View details about histogram');
      assert.ok(result.fullPath.includes('PATH'));
      assert.ok(result.fullPath.includes('DAQ01/EquipmentSize/CPV/CPV'));
      assert.ok(result.lastModified.includes('LAST MODIFIED'));
    });
  });
});