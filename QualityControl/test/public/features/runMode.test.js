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
/* eslint-disable @stylistic/js/max-len */

import { strictEqual, ok } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { IntegratedServices } from '../../../common/library/enums/Status/integratedServices.enum.js';
import { ServiceStatus } from '../../../common/library/enums/Status/serviceStatus.enum.js';
import { integratedServiceInterceptor } from '../../testUtils/interceptors/integratedServiceInterceptor.js';

// If using nock for HTTP mocking (uncomment if available)
// import nock from 'nock';
export const runModeTests = async (url, page, timeout = 5000, testParent) => {
  const mockedTestRunNumber = 500001;
  let countOngoingRunsCalls = 0;
  let countRunStatusCalls = 0;
  let expectCountRunStatusCalls = 0;
  let countObjectsCalls = 0;

  page.on('request', (req) => {
    const url = req.url();
    const decodedUrl = decodeURIComponent(url);
    if (url.includes('/api/filter/ongoingRuns')) {
      countOngoingRunsCalls++;
    }
    if (url.includes('/api/objects') && decodedUrl.includes(`filters[RunNumber]=${mockedTestRunNumber}`)) {
      countObjectsCalls++;
    } else if (url.includes(`/api/filter/run-status/${mockedTestRunNumber}`)) {
      countRunStatusCalls++;
    }
  });

  await testParent.test('when kafka service is not configured the run mode toggle should be hidden', { timeout }, async () => {
    const requestHandler = (request) => integratedServiceInterceptor(request, IntegratedServices.KAFKA, ServiceStatus.NOT_CONFIGURED);

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.goto(
        `${url}?page=objectTree`,
        { waitUntil: 'networkidle0' },
      );
      await delay(100);
      // Prevent the 'get run status' from re-triggering mid test
      await page.evaluate(() => {
        window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 12000000;
      });

      const runsModeToggleNoExist = await page.evaluate(() => document.querySelector('#run-mode-switch') === null);
      ok(runsModeToggleNoExist, 'The RunMode switch should not be displayed');

      const runsModeErrorNoExist = await page.evaluate(() => document.querySelector('#run-mode-failure') === null);
      ok(runsModeErrorNoExist, 'The RunMode switch should not be displayed');
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('when kafka service is unavailable nothing should be displayed (rely on about page)', { timeout }, async () => {
    const requestHandler = (request) => integratedServiceInterceptor(request, IntegratedServices.KAFKA, ServiceStatus.ERROR, {
      message: 'test error',
    });

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.goto(
        `${url}?page=objectTree`,
        { waitUntil: 'networkidle0' },
      );
      await delay(100);
      // Prevent the 'get run status' from re-triggering mid test
      await page.evaluate(() => {
        window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 12000000;
      });

      const runsModeNoExist = await page.evaluate(() => document.querySelector('#run-mode-switch') === null);
      ok(runsModeNoExist, 'The RunMode switch should not be displayed');
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('should have a switch to enable run mode when kafka service is available', { timeout }, async () => {
    // The kafka service is required for run mode to be available
    const requestHandler = (request) => integratedServiceInterceptor(request, IntegratedServices.KAFKA, ServiceStatus.SUCCESS);

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.goto(
        `${url}?page=objectTree`,
        { waitUntil: 'networkidle0' },
      );
      await delay(100);
      // Prevent the 'get run status' from re-triggering mid test
      await page.evaluate(() => {
        window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 12000000;
      });

      await page.locator('#run-mode-switch > .switch');
      const runsModeTitle = await page.evaluate(() => document.querySelector('#run-mode-switch')?.textContent);
      strictEqual(runsModeTitle, 'Run mode', 'The text displayed is not `Run mode`');
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('should have a switch to enable run mode', { timeout }, async () => {
    // The kafka service is required for run mode to be available
    const requestHandler = (request) => integratedServiceInterceptor(request, IntegratedServices.KAFKA, ServiceStatus.SUCCESS);

    try {
      // Enable interception and attach the handler
      await page.setRequestInterception(true);
      page.on('request', requestHandler);

      await page.goto(
        `${url}?page=objectTree`,
        { waitUntil: 'networkidle0' },
      );
      await delay(100);
      // Prevent the 'get run status' from re-triggering mid test
      await page.evaluate(() => {
        window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 12000000;
      });
      await page.locator('#run-mode-switch > .switch');
      const runsModeTitle = await page.evaluate(() =>
        document.querySelector('#run-mode-switch')?.textContent);
      strictEqual(runsModeTitle, 'Run mode', 'The text displayed is not `Run mode`');
    } finally {
      // Cleanup: remove listener and disable interception
      page.off('request', requestHandler);
      await page.setRequestInterception(false);
    }
  });

  await testParent.test('should activate run mode', { timeout }, async () => {
    await page.locator('#run-mode-switch > .switch').click();
    await delay(500);
    expectCountRunStatusCalls ++;

    const isRunModeActivated = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActivated, 'Run mode should be activated');
  });

  await testParent.test('should make a request to ongoing runs API', { timeout }, async () => {
    await delay(200);
    strictEqual(countOngoingRunsCalls, expectCountRunStatusCalls, `Expect 1 req to /api/filter/ongoingRuns, but got ${countOngoingRunsCalls}`);
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
    ok(currentUrl.includes(`RunNumber=${mockedTestRunNumber}`), `URL should contain RunNumber=${mockedTestRunNumber} parameter`);

    const selectedRunNumber = await page.evaluate(() => {
      const selector = document.querySelector('#ongoingRunsFilter');
      return selector.value;
    });
    strictEqual(selectedRunNumber, mockedTestRunNumber.toString(), 'First ongoing run should be automatically selected');
  });

  await testParent.test('should show ENDED status when run finishes', { timeout }, async () => {
    await delay(500);
    // Manually trigger refresh, we need to do this since periodic refresh is off (high delay) due to inconsistant tests.
    await page.evaluate(async (mockedTestRunNumber) => {
      await model.filterModel._refreshRunsModeStatus(model.layoutListModel, mockedTestRunNumber);
    }, mockedTestRunNumber);
    expectCountRunStatusCalls++;
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
    expectCountRunStatusCalls++;// fetches run information on page load
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
    ok(runInfo.value, mockedTestRunNumber.toString());
    ok(runInfo.status, 'ENDED');
  });

  await testParent.test('should exit runs mode successfully', { timeout }, async () => {
    // Verify run mode is currently active
    let isRunModeActive = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActive, 'Run mode should be active before disabling');

    // Click the run mode checkbox to disable it
    await page.locator('#run-mode-switch > .switch').click();
    await delay(100);

    // Verify run mode is now deactivated
    isRunModeActive = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(!isRunModeActive, 'Run mode should be deactivated after clicking checkbox');

    //check the filters element is back again and run number and URL are cleared
    await page.locator('#filterElement');
    const currentUrl = await page.evaluate(() => window.location.href);
    ok(!currentUrl.includes(`RunNumber=${mockedTestRunNumber}`), 'URL should not contain RunNumber parameter after disabling run mode');

    //filterElement to be empty
    const filterElementContent = await page.evaluate(() => {
      const filterElement = document.querySelector('#runNumberFilter');
      return filterElement.textContent.trim();
    });
    strictEqual(filterElementContent, '', 'Filter element should be empty after disabling run mode');
  });

  await testParent.test('should make requests for run status and objects of selected run', { timeout }, () => {
    strictEqual(countRunStatusCalls, expectCountRunStatusCalls, `Expected: ${expectCountRunStatusCalls} req to /api/filter/run-status, actual: ${countRunStatusCalls}`);
    strictEqual(countObjectsCalls, 2, `Expected: 2 req to /api/objects, actual: ${countObjectsCalls}`);
  });
};
