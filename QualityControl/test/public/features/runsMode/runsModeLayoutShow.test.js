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

const OBJECT_TREE_PAGE_PARAM = '?page=objectTree';
export const runsModeLayoutShowTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should activate runs mode in object tree page', async () => {
    await page.goto(`${url}${OBJECT_TREE_PAGE_PARAM}`, { waitUntil: 'networkidle0' });
    //wait for filters
    await page.waitForSelector('#runNumberFilter', { timeout });
    await page.waitForSelector('#runTypeFilter', { timeout });
    //select run number and run type
    await page.type('#runNumberFilter', '0');
    await page.click('#runTypeFilter');
    await page.select('#runTypeFilter', 'runType1');
    //check dropdown is available
    await page.waitForSelector('#triggerFilterButton', { timeout });
    await page.click('#triggerFilterButton');
    await page.waitForSelector('#updateAndRunModeButton', { timeout });
    const isButtonEnabled = await page.evaluate(() => {
      const button = document.querySelector('#updateAndRunModeButton');
      return button && !button.disabled;
    });
    strictEqual(isButtonEnabled, true, 'updateAndRunModeButton should be enabled when run number is entered');

    // Activate runs mode
    await page.click('#updateAndRunModeButton');
    await page.waitForSelector('#runModeHeader', { timeout });
  });

  await testParent.test('should navigate to layout page and verify runs mode persists', async () => {
    // Navigate to layout page using the provided selector
    await page.waitForSelector('.sidebar > div:nth-of-type(3) a:nth-child(1)', { visible: true, stable: true });
    await page.locator('.sidebar > div:nth-of-type(3) a:nth-child(1)').click(); // navigate to layout show

    //wait for network

    // Wait for layout page to load
    await page.waitForSelector('#runModeHeader', { timeout });

    // Verify runs mode header elements are present
    await page.waitForSelector('#runNumber', { timeout });
    await page.waitForSelector('#runStatus', { timeout });
    await page.waitForSelector('#runsModeInfoButton', { timeout });
    await page.waitForSelector('#exitRunModeButton', { timeout });

    const [runNumberDisplayed, runStatusDisplayed, infoButtonDisplayed, exitButtonDisplayed] =
    await page.evaluate(() => {
      const runNumber = document.querySelector('#runNumber');
      const runStatus = document.querySelector('#runStatus');
      const infoButton = document.querySelector('#runsModeInfoButton');
      const exitButton = document.querySelector('#exitRunModeButton');

      return [
        runNumber?.children[0]?.textContent === 'Run' && runNumber?.children[1]?.textContent === '#0',
        runStatus?.children[0]?.textContent === 'Status:' && runStatus?.children[1]?.textContent === 'ONGOING',
        infoButton?.title === 'Show status information',
        exitButton?.textContent === 'Exit' && exitButton?.title === 'Exit run mode and show all filters',
      ];
    });
    strictEqual(runNumberDisplayed, true, 'runNumber should be displayed in layout page');
    strictEqual(runStatusDisplayed, true, 'runStatus should be displayed in layout page');
    strictEqual(infoButtonDisplayed, true, 'infoButton should be displayed in layout page');
    strictEqual(exitButtonDisplayed, true, 'exitRunModeButton should be displayed in layout page');

    // Verify runs mode is still active
    const isRunMode = await page.evaluate(() => window.model.filterModel.inRunMode);
    strictEqual(isRunMode, true, 'inRunMode should persist in layout page');
  });

  await testParent.test('should exit run mode from layout page', async () => {
    await page.click('#exitRunModeButton');

    // filters are shown again
    await page.waitForSelector('#filterElement', { timeout });
    await page.waitForSelector('#triggerFilterButton', { timeout });
    // window.model.filterModel.inRunMode is false
    const isRunMode = await page.evaluate(() => window.model.filterModel.inRunMode);
    strictEqual(isRunMode, false, 'inRunMode should be false after exiting from layout page');
  });
};
