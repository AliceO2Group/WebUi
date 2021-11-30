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
const confVariables = config.vars;

let page;

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    page = coreTests.page;
  });

  it('should successfully load newEnvironment page', async () => {
    await page.goto(url + '?page=newEnvironment', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    await page.waitForTimeout(5000);
    assert.strictEqual(location.search, '?page=newEnvironment');
  });

  it('should successfully request a list of template objects', async () => {
    const templates = await page.evaluate(() => window.model.workflow.templates);
    assert.strictEqual(templates.kind, 'Success', `Request for list of template objects failed due to: ${templates.payload}`);
    assert.ok(templates.payload.length !== 0);
  });

  it(`should successfully select workflow '${workflowToTest}' from template list`, async () => {
    const [button] = await page.$x(`//div/a[text()="${workflowToTest}"]`);
    if (button) {
      await button.click();
    } else {
      assert.ok(false, `${workflowToTest} could not be found in list of workflows`);
    }
    await page.waitForTimeout(200);
  });

  it('should display variables (K;V) panel', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div', {timeout: 2000});
    const title = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div').innerText);
    assert.strictEqual('Advanced Configuration', title, 'Could not find the Advanced Configuration Panel');
  });

  it('should successfully add provided K:V pairs', async () => {
    for (const key in confVariables) {
      if (key && confVariables[key] !== undefined) {
        await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div > input');
        page.keyboard.type(key);
        await page.waitForTimeout(500);

        await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div:nth-child(2) > textarea');
        page.keyboard.type(confVariables[key]);
        await page.waitForTimeout(500);

        await page.evaluate(() => {
          document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div:nth-child(3) > div:nth-child(2) > div:nth-child(3)').click();
        });
        await page.waitForTimeout(500);
      }
    }
    await page.evaluate(() => window.model.workflow.form.variables);
  });

  it('should have successfully select first detector by default from area list', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(2) > div > div:nth-child(2) > div > a').click());
    const selectedDet = await page.evaluate(() => window.model.workflow.flpSelection.selectedDetectors);
    assert.deepStrictEqual(selectedDet, ['TST'], 'Missing detector selection');
    await page.waitForTimeout(500);
  });

  it('should successfully have a list of FLPs after detector selection', async () => {
    const flps = await page.evaluate(() => window.model.workflow.flpSelection.list.payload);
    assert.ok(flps.length > 0);
  });

  it('should successfully preselect hosts for TST detector', async () => {
    const flps = await page.evaluate(() => window.model.workflow.form.hosts);
    assert.ok(flps.length > 0);
  });

  it(`should successfully create a new environment based on workflow '${workflowToTest}'`, async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > button:nth-child(2)').click());
    await waitForCoreResponse(page, reqTimeout);

    const location = await page.evaluate(() => window.location);
    const queryResult = await page.evaluate(() => window.model.environment.itemNew);
    const revision = await page.evaluate(() => window.model.workflow.form.revision);

    assert.strictEqual(queryResult.kind, 'NotAsked', `Environment ${workflowToTest} with revision ${revision} was not created due to: ${queryResult.payload}`);
    assert.ok(location.search.includes('?page=environment&id='), 'GUI did not redirect successfully to the newly created environment. Check logs for more details');
  });
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
        await page.waitForTimeout(1000);
        resolve();
      } else {
        await page.waitForTimeout(1000);
      }
    }
  });
}
