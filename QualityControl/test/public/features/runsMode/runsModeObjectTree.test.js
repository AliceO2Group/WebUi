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
export const runsModeObjectTreeTests = async (url, page, timeout = 5000, testParent) => {
  await testParent.test('should enable updateAndRunModeButton when run number is entered', async () => {
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
  });

  await testParent.test('should show runModeHeader when updateAndRunModeButton is clicked', async () => {
    await page.click('#updateAndRunModeButton');
    //check the url to not have runType as filter
    const currentUrl = page.url();
    strictEqual(currentUrl.includes('RunType'), false, 'RunType should not be in url');
    strictEqual(currentUrl.includes('RunNumber'), true, 'RunNumber should be in url');

    //wait for elements in run mode header
    await page.waitForSelector('#runModeHeader', { timeout });
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
    strictEqual(runNumberDisplayed, true, 'runNumber should be displayed');
    strictEqual(runStatusDisplayed, true, 'runStatus should be displayed');
    strictEqual(infoButtonDisplayed, true, 'infoButton should be displayed');
    strictEqual(exitButtonDisplayed, true, 'exitRunModeButton should be displayed');
  });

  await testParent.test('should show statusInfoDropdown when runsModeInfoButton is clicked', async () => {
    await page.click('#runsModeInfoButton');
    await page.waitForSelector('#statusInfoDropdown', { timeout });
    await page.waitForSelector('#runStatusList', { timeout });
    const runStatusList = await page.evaluate(() => {
      const runStatusList = document.querySelector('#runStatusList');
      return runStatusList?.children?.length === 4;
    });
    strictEqual(runStatusList, true, 'list of status should have 4 elements');
  });

  await testParent.test('should exit run mode when exitRunModeButton is clicked', async () => {
    await page.click('#exitRunModeButton');

    // filters are shown again
    await page.waitForSelector('#filterElement', { timeout });
    await page.waitForSelector('#triggerFilterButton', { timeout });
    // window.model.filterModel.inRunMode is false
    const isRunMode = await page.evaluate(() => window.model.filterModel.inRunMode);
    strictEqual(isRunMode, false, 'inRunMode should be false');
  });
};
