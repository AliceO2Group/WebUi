import { strictEqual, ok } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
export const runModeTests = async (url, page, timeout = 5000, testParent) => {
  //
  await testParent.test('should have a switch to enable runs mode', { timeout }, async () => {
    await page.goto(
      `${url}?page=objectTree`,
      { waitUntil: 'networkidle0' },
    );
    await page.locator('.form-check-label > .switch');
    const runsModeTitle = await page.evaluate(() =>
      document.querySelector('.form-check-label').textContent);
    strictEqual(runsModeTitle, 'Runs mode', 'The text displayed is not `Runs mode`');
  });

  await testParent.test('should enter runs mode successfully', { timeout }, async () => {
    await page.locator('.form-check-label > .switch').click();
    await delay(50);
    await page.locator('#filterElement');

    const updateButtonIsDisabled = await page.evaluate(() =>
      document.querySelector('#updateAndRunModeButton').disabled);
    const isRunNumberFilterEmpty = await page.evaluate(() =>
      document.querySelector('#runNumberFilter').value === '');
    const isRunModeActivated = await page.evaluate(() =>
      window.model.filterModel.isRunModeActivated);
    ok(updateButtonIsDisabled);
    ok(isRunNumberFilterEmpty);
    ok(isRunModeActivated);
    delay(200);
  });

  await testParent.test('should allow user to track a run', { timeout }, async () => {
    const urlRunStatus = '/api/filter/run-status/566138';
    const urlObjects = '/api/objects?inRunMode=true&filters[RunNumber]=566138';
    let countRunStatusCalls = 0;
    let countObjectsCalls = 0;
    page.on('request', (req) => {
      if (req.url().includes(encodeURI(urlRunStatus))) {
        countRunStatusCalls++;
      }
      if (req.url().includes(encodeURI(urlObjects))) {
        countObjectsCalls++;
      }
    });
    await page.evaluate(() => {
      window.model.filterModel.ONGOING_RUN_INTERVAL_MS = 500;
    });
    await page.locator('#runNumberFilter').fill('566138');
    await delay(50);
    const updateButtonIsDisabled = await page.evaluate(() =>
      document.querySelector('#updateAndRunModeButton').disabled);
    strictEqual(updateButtonIsDisabled, false, 'Button should be disabled if run number has not been set');
    await page.locator('#updateAndRunModeButton').click();
    await page.waitForSelector('#runStatusPanel');
    const runStatusInfo = await page.evaluate(() => {
      const runNumber = document.querySelector('#runNumber').textContent;
      const status = document.querySelector('#runStatus').textContent;
      return { runNumber, status };
    });
    strictEqual(runStatusInfo.runNumber, '#566138');
    strictEqual(runStatusInfo.status, 'ONGOING');
    const request = await page.waitForRequest((request) =>
      request.url().includes('/api/filter/run-status/566138'));
    ok(request);
    await delay(1000);
    strictEqual(countRunStatusCalls, 3, `Expected 3 requests to filter/run-status, but got ${countRunStatusCalls}`);
    strictEqual(countObjectsCalls, 2, `Expected  requests to api/objects, but got ${countObjectsCalls}`);
  });

  await testParent.test('should show `ENDED` if a run that was ongoing, finishes', { timeout }, async () => {
    let count = 0;
    page.on('request', (req) => {
      if (req.url().includes('/api/filter/run-status/566138')) {
        count++;
      }
    });

    //nock has been configured to stop the run after 3 calls
    await page.waitForSelector('#runStatusPanel');
    const runStatusInfo = await page.evaluate(() => {
      const runNumber = document.querySelector('#runNumber').textContent;
      const status = document.querySelector('#runStatus').textContent;
      return { runNumber, status };
    });
    strictEqual(runStatusInfo.runNumber, '#566138');
    strictEqual(runStatusInfo.status, 'ENDED');
    await delay(500);
    strictEqual(count, 0, `No requests expected, but got ${count}`);
  });

  await testParent.test('should persist runs mode between pages', { timeout }, async () => {
    await page.locator('.menu-item:nth-child(3) > .ph2').click();
    await page.waitForSelector('#runStatusPanel');
    const runInfo = await page.evaluate(() => {
      const runNumber = document.querySelector('#runNumber').textContent;
      const status = document.querySelector('#runStatus').textContent;
      return { runNumber, status };
    });
    const isRunModeActivated = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(isRunModeActivated);
    ok(runInfo.runNumber, '#566138');
    ok(runInfo.status, 'ENDED');
  });

  await testParent.test('should exit runs mode successfully', { timeout }, async () => {
    await page.locator('.form-check-label > .switch').click();
    await delay(50);
    const isRunModeActivated = await page.evaluate(() => window.model.filterModel.isRunModeActivated);
    ok(!isRunModeActivated);
  });
};
