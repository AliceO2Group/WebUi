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

import { strictEqual, ok } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { RunStatus } from '../../../common/library/runStatus.enum.js';

export const filterTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('filter should persist between pages', { timeout }, async () => {
    // Navigate to objects tree
    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );

    //Fill and trigger the filter
    await page.locator('#runNumberFilter').fill('0');
    await page.locator('#triggerFilterButton').click();

    // URL should contain run number
    const location = await page.evaluate(() => window.location);
    strictEqual(location.href.includes('RunNumber=0'), true, 'URL should contain RunNumber=0');

    //Naviagte to object view
    await extendTree(3, 4);
    await page.locator('tbody tr:nth-child(4) td').click();
    await page.waitForSelector('#fullscreen-button');
    await page.locator('#fullscreen-button').click();
    await page.waitForSelector('#runNumberFilter', { visible: true });

    // Check that filter is still set to 0
    let value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, '0', 'RunNumber filter should still be set to 0 on objectView page');

    // Navigate to layout show
    await page.locator('.menu-item:nth-child(1)').click();
    await page.waitForSelector('#runNumberFilter', { visible: true });

    // Check that filter is still set to 0
    value = await page.evaluate(() => document.querySelector('#runNumberFilter').value);
    strictEqual(value, '0', 'RunNumber filter should still be set to 0 on layout show page');
  });

  await testParent.test(
    'should display detector qualities when filtering by run number if it has any',
    { timeout },
    async () => {
      const requestHandler = async (interceptedRequest) => {
        const url = interceptedRequest.url();

        if (url.includes('/api/filter/run-status/0')) {
          // Mock the response
          await interceptedRequest.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              detectorsQualities: [
                { id: 1, name: 'DETECTOR_GOOD_1', quality: 'good' },
                { id: 1, name: 'DETECTOR_GOOD_2', quality: 'good' },
                { id: 2, name: 'DETECTOR_BAD', quality: 'bad' },
              ],
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

        await page.locator('#triggerFilterButton').click();
        const detectorQualities = await page.waitForSelector('#header-detector-qualities', {
          visible: true,
          timeout: 1000,
        });
        ok(detectorQualities, 'Detector qualities should exist on the page');

        const goodDetectorCount = await page.evaluate(() =>
          document.querySelectorAll('#header-detector-qualities .success').length);
        const badDetectorCount = await page.evaluate(() =>
          document.querySelectorAll('#header-detector-qualities .danger').length);

        strictEqual(goodDetectorCount, 2, 'Two good detector qualities should exist on the page');
        strictEqual(badDetectorCount, 1, 'One bad detector qualities should exist on the page');
      } catch (error) {
        // Test failed
        ok(false, error.message);
      } finally {
        // Cleanup: remove listener and disable interception
        page.off('request', requestHandler);
        await page.setRequestInterception(false);
      }
    },
  );

  await testParent.test(
    'should not display detector qualities if the run has none when filtering by run number',
    { timeout },
    async () => {
      const requestHandler = async (interceptedRequest) => {
        const url = interceptedRequest.url();

        if (url.includes('/api/filter/run-status/0')) {
          // Mock the response
          await interceptedRequest.respond({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              detectorsQualities: [],
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

        await page.locator('#triggerFilterButton').click();
        await delay(100);

        const runDetectorQualitiesExists = await page.evaluate(() =>
          document.querySelector('#header-detector-qualities') !== null);
        strictEqual(runDetectorQualitiesExists, false, 'Run detector qualities should not exists on the page');
      } catch (error) {
        // Test failed
        ok(false, error.message);
      } finally {
        // Cleanup: remove listener and disable interception
        page.off('request', requestHandler);
        await page.setRequestInterception(false);
      }
    },
  );

  await testParent.test('not filtering by run number should not display any run information', { timeout }, async () => {
    await page.locator('#runNumberFilter').fill('Backspace');
    await page.locator('#triggerFilterButton').click();
    await delay(100);

    // Not filtering by run number should not display the run information
    const runInformationExists = await page.evaluate(() => document.querySelector('#header-run-information') !== null);
    strictEqual(runInformationExists, false, 'Run information should not exists on the page');
  });

  await testParent.test('filtering by run number should display the run information', { timeout }, async () => {
    const requestHandler = async (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (url.includes('/api/filter/run-status/0')) {
        // Mock the response
        await interceptedRequest.respond({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            runStatus: RunStatus.UNKNOWN,
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

      // Fill and trigger the filter
      await page.locator('#runNumberFilter').fill('0');
      await page.locator('#triggerFilterButton').click();

      // Filtering by run number should display the run information
      const runInformation = await page.waitForSelector('#header-run-information', { visible: true, timeout: 1000 });
      ok(runInformation, 'Run information should exists on the page');
    } catch (error) {
      // Test failed
      ok(false, error.message);
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('should list all objects when clearing filters', { timeout }, async () => {
    await page.locator('#triggerFilterButton').click();
    await delay(100);
    //Navigate to object tree
    ///html/body/div[1]/div/nav/a[2]
    await page.locator('nav > a:nth-child(3)').click();

    //With filter applied
    let objectList = await page.evaluate(() => window.model.object.list);
    strictEqual(objectList.length, 1);

    //Clear filters
    await page.locator('#clearFilterButton').click();
    await delay(100);
    objectList = await page.evaluate(() => window.model.object.list);
    strictEqual(objectList.length, 4);
  });

  await testParent.test('ObjectShow should only list versions based on the filter', { timeout }, async () => {
    await page.goto(
      `${url}?page=objectView&objectName=qc/test/object/1`,
      { waitUntil: 'networkidle0' },
    );
    let optionsCount = await page.evaluate(() => document.querySelector('#dateSelector').length);
    strictEqual(optionsCount, 2);

    await page.locator('#runNumberFilter').fill('0');
    await page.locator('#triggerFilterButton').click();

    await delay(200);

    optionsCount = await page.evaluate(() => document.querySelector('#dateSelector').length);
    strictEqual(optionsCount, 1);
  });

  await testParent.test('ObjectTreePage should apply filters for the objects', { timeout }, async () => {
    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );

    let rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);
    strictEqual(rowCount, 8);

    const runNumber = '0';
    await page.locator('#runNumberFilter').fill(runNumber);
    await page.locator('#filterElement #triggerFilterButton').click();

    await extendTree(3, 5);

    rowCount = await page.evaluate(() => document.querySelectorAll('tr').length);
    strictEqual(rowCount, 5); // Due to the filter there are two objects fewer.
  });

  await testParent.test('ObjectTree infoPanel should show filtered object versions', { timeout }, async () => {
    const versionsPath = '.outline-gray.flex-grow.relative select option';
    await page.locator('tr:last-of-type td').click();
    await page.waitForSelector(versionsPath);

    let versionCount = await page.evaluate((path) => document.querySelectorAll(path).length, versionsPath);
    strictEqual(versionCount, 1, 'Number of versions is not 1');

    await page.locator('#filterElement #clearFilterButton').click();
    await page.locator('#filterElement #triggerFilterButton').click();

    await extendTree(3, 5);

    await page.locator('tr:nth-of-type(4)').click(); // object/1 is now in the 4th row.
    await page.waitForSelector(versionsPath);

    versionCount = await page.evaluate((path) => document.querySelectorAll(path).length, versionsPath);
    strictEqual(versionCount, 2, 'Number of versions is not 2');
  });

  /**
   * Helper function to extend object trees
   * @param {number} startIndex - The number of rows that the objectTree starts of with.
   * @param {number} subtreeCount - The number of rows at which you stop extending the tree.
   */
  async function extendTree(startIndex, subtreeCount) {
    await page.waitForSelector('tr:last-of-type td');

    for (let i = startIndex; i < subtreeCount; i++) {
      await page.locator('tr:last-of-type td').click();
      await page.waitForFunction((count) => document.querySelectorAll('tr').length > count, {}, i);
    }
  }
};
