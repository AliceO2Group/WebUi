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

// If using nock for HTTP mocking (uncomment if available)
// import nock from 'nock';
export const runModeTests = async (url, page, timeout = 5000, testParent) => {
  let countOngoingRunsCalls = 0;
  let countRunStatusCalls = 0;
  let countObjectsCalls = 0;

  page.on('request', (req) => {
    const url = req.url();
    const decodedUrl = decodeURIComponent(url);
    if (url.includes('/api/filter/ongoingRuns')) {
      countOngoingRunsCalls++;
    }
    if (url.includes('/api/filter/run-status/500001')) {
      countRunStatusCalls++;
    }
    if (url.includes('/api/objects') && decodedUrl.includes('filters[RunNumber]=500001')) {
      countObjectsCalls++;
    }
  });

  await testParent.test('should have a switch to enable runs mode', { timeout }, async () => {
    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );
    await page.evaluate(() => {
      window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 500;
    });
    await page.locator('.form-check-label > .switch');
    const runsModeTitle = await page.evaluate(() =>
      document.querySelector('.form-check-label').textContent);
    strictEqual(runsModeTitle, 'Runs mode', 'The text displayed is not `Runs mode`');
  });

  await testParent.test('should activate run mode', { timeout }, async () => {
    await page.locator('.form-check-label > .switch').click();
    await delay(50);

    const isRunModeActivated = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActivated, 'Run mode should be activated');
  });

  await testParent.test('should make a request to ongoing runs API', { timeout }, async () => {
    await delay(200);
    strictEqual(countOngoingRunsCalls, 1, `Expect 1 req to /api/filter/ongoingRuns, but got ${countOngoingRunsCalls}`);
  });

  await testParent.test('should display ongoing runs selector', { timeout }, async () => {
    await page.waitForSelector('#ongoingRunsFilter', { timeout: 1000 });
    const selector = await page.locator('#ongoingRunsFilter');
    ok(selector, 'Ongoing runs selector should be present');
  });

  await testParent.test('should have correct options in ongoing runs selector', { timeout }, async () => {
    const availableOptions = await page.evaluate(() => {
      const selector = document.querySelector('#ongoingRunsFilter');
      return Array.from(selector.options)
        .map((option) => option.value)
        .filter((value) => value !== '');
    });

    ok(availableOptions.length > 0, 'Should have ongoing runs available in selector');
    ['500001', '500002', '500003'].forEach((run) => {
      ok(availableOptions.includes(run), `Should include mock run ${run}`);
    });
  });

  await testParent.test('should automatically select first run and update URL', { timeout }, async () => {
    await delay(500);
    const currentUrl = await page.evaluate(() => window.location.href);
    ok(currentUrl.includes('RunNumber=500001'), 'URL should contain RunNumber=500001 parameter');

    const selectedRunNumber = await page.evaluate(() => {
      const selector = document.querySelector('#ongoingRunsFilter');
      return selector.value;
    });
    strictEqual(selectedRunNumber, '500001', 'First ongoing run should be automatically selected');
  });

  await testParent.test('should make requests for run status and objects of selected run', { timeout }, async () => {
    strictEqual(countRunStatusCalls, 2, `Expected: 2 req to /api/filter/run-status, actual: ${countRunStatusCalls}`);
    strictEqual(countObjectsCalls, 2, `Expected: 2 req to /api/objects, actual: ${countObjectsCalls}`);
  });

  await testParent.test('should show ENDED status when run finishes', { timeout }, async () => {
    await delay(1000);
    await page.waitForSelector('#runStatusPanel');
    const runStatusInfo = await page.evaluate(() => {
      const status = document.querySelector('#runStatusBadge')?.textContent;
      return { status };
    });

    // Verify the run status changed to ENDED
    strictEqual(runStatusInfo.status, 'ENDED', 'Run status should be ENDED');
  });

  await testParent.test('should persist runs mode between pages', { timeout }, async () => {
    await page.locator('.menu-item:nth-child(3) > .ph2').click();
    await page.waitForSelector('#runStatusPanel');
    const runInfo = await page.evaluate(() => {
      const status = document.querySelector('#runStatusBadge').textContent;
      const selector = document.querySelector('#ongoingRunsFilter');
      const [, firstOption] = selector.options;
      const isSelected = firstOption.selected;
      const { value } = firstOption;
      return { status, isSelected, value };
    });
    const isRunModeActivated = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActivated);
    ok(runInfo.isSelected);
    ok(runInfo.value, '500001');
    ok(runInfo.status, 'ENDED');
  });

  await testParent.test('should exit runs mode successfully', { timeout }, async () => {
    // Verify run mode is currently active
    let isRunModeActive = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActive, 'Run mode should be active before disabling');

    // Click the run mode checkbox to disable it
    await page.locator('.form-check-label > .switch').click();
    await delay(100);

    // Verify run mode is now deactivated
    isRunModeActive = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(!isRunModeActive, 'Run mode should be deactivated after clicking checkbox');

    //check the filters element is back again
    await page.locator('#filterElement');
  });
};
