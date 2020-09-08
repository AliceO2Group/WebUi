/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

/* eslint-disable max-len */
const assert = require('assert');
const coreTests = require('./core-tests');
const config = require('./config-provider');

const url = config.url;
const workflowToTest = config.workflow;
const reqTimeout = config.requestTimeout;

let page;

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    page = coreTests.page;
  });

  it('should successfully load newEnvironment page', async () => {
    await page.goto(url + '?page=newEnvironment', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    await page.waitFor(2000);
    assert.strictEqual(location.search, '?page=newEnvironment');
  });

  it('should successfully request a list of template objects', async () => {
    const templatesMap = await page.evaluate(() => {
      return window.model.workflow.templatesMap;
    });
    const repository = 'github.com/AliceO2Group/ControlWorkflows/';
    assert.strictEqual(templatesMap.kind, 'Success', `Request for list of template objects failed due to: ${templatesMap.payload}`);
    assert.ok(templatesMap.payload[repository]);
  });

  it(`should successfully select workflow '${workflowToTest}' from template list`, async () => {
    const [button] = await page.$x(`//div/a[text()="${workflowToTest}"]`);
    if (button) {
      await button.click();
    } else {
      assert.ok(false, `${workflowToTest} could not be found in list of workflows`);
    }
    await page.waitFor(200);
  });

  it('should display variables (K;V) panel', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > h5', {timeout: 2000});
    const title = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(3) > div:nth-child(2) > h5').innerText);
    assert.strictEqual('Advanced Configuration', title, 'Could not find the Advanced Configuration Panel');
  });

  it('should successfully request a list of FLP names', async () => {
    const flpList = await page.evaluate(() => window.model.workflow.flpList);

    assert.strictEqual(flpList.kind, 'Success', 'Could not retrieve list of FLPs from Consul');
    assert.ok(flpList.payload.length > 0, 'No FLPs were found in Consul');
  });

  it(`should successfully pre-select all FLPS by default`, async () => {
    const flps = await page.waitFor(() => window.model.workflow.form.hosts);
    assert.ok(flps.length > 0, 'No hosts were selected');
  });

  it('should successfully enable Data Distribution', async () => {
    const [ddOnButton] = await page.$x(`//div/input[@id="dataDistributionOn"]`);
    if (ddOnButton) {
      await ddOnButton.click();
    } else {
      assert.ok(false, `Data Distribution radio button ON could not be found`);
    }
    await page.waitFor(200);
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.strictEqual(basicVars['dd_enabled'], 'true', 'dd_enabled was not set to true');
  });

  it('should successfully disable trigger', async () => {
    const [triggerOffButton] = await page.$x(`//div/input[@id="triggerOff"]`);
    if (triggerOffButton) {
      await triggerOffButton.click();
    } else {
      assert.ok(false, `Trigger radio button OFF could not be found`);
    }
    await page.waitFor(200);
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.strictEqual(basicVars['roc_ctp_emulator_enabled'], 'false', 'dd_enabled was not set to true');
  });

  it('should successfully set the user as flp', async () => {

  });

  it('should successfully add new variable (stfb_standalone;true)', async () => {

  });

  // it(`should successfully create a new environment based on workflow '${workflowToTest}'`, async () => {
  //   await page.evaluate(() => document.querySelector(
  //     'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div  > div:nth-child(2) > button').click());
  //   await waitForCoreResponse(page, reqTimeout);

  //   const location = await page.evaluate(() => window.location);
  //   const queryResult = await page.evaluate(() => window.model.environment.itemNew);
  //   const revision = await page.evaluate(() => window.model.workflow.form.revision);

  //   assert.strictEqual(queryResult.kind, 'NotAsked', `Environment ${workflowToTest} with revision ${revision} was not created due to: ${queryResult.payload}`);
  //   assert.ok(location.search.includes('?page=environment&id='), 'GUI did not redirect successfully to the newly created environment. Check logs for more details');
  // });
});

/**
 * Wait for response from AliECS Core
 * Method will check if loader is still active (requests still pending) every second for 90 seconds
 * @param {Object} page
 * @param {number} timeout
 * @return {Promise}
 */
async function waitForCoreResponse(page, timeout = 90) {
  return new Promise(async (resolve) => {
    let i = 0;
    while (i++ < timeout) {
      const isLoaderActive = await page.evaluate(() => window.model.loader.active);
      if (!isLoaderActive) {
        await page.waitFor(1000);
        resolve();
      } else {
        await page.waitFor(1000);
      }
    }
  });
}
