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
const reqTimeout = config.requestTimeout;

let page;
const workflowToTest = config.workflow;

describe('`Control Environment` test-suite', async () => {
  let revision = '';
  before(async () => {
    page = coreTests.page;
  });

  it(`should be on page of new environment (workflow '${workflowToTest}') just created`, async () => {
    const location = await page.evaluate(() => window.location);
    revision = await page.evaluate(() => window.model.workflow.form.revision);
    assert.ok(location.search.includes('?page=environment&id='));
  });

  it(`should have one button for START in state CONFIGURED (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    const startButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(1)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'CONFIGURED', 'WRONG state of environment');
    assert.strictEqual(startButton, 'START', 'Could not find button for starting environment probably due to bad state of environment');
  });

  it(`should successfully transition CONFIGURED -> RUNNING by clicking START button (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
    await waitForCoreResponse(page, reqTimeout);

    const controlAction = await page.evaluate(() => window.model.environment.itemControl);
    const environment = await page.evaluate(() => window.model.environment.item);
    const state = environment.payload.environment.state;

    assert.ok(controlAction.kind !== 'Failure', `Transition of workflow '${workflowToTest}' with revision: '${revision}' was not successful due to: ${controlAction.payload}`);
    assert.strictEqual(state, 'RUNNING', 'Environment was expected to be running');
  });

  it(`should have one button for STOP in state RUNNING (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    const stopButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'RUNNING', `WRONG state of environment based on workflow '${workflowToTest}' with revision: '${revision}'`);
    assert.strictEqual(stopButton, 'STOP', 'Could not found button for stopping environment probably due to bad state of environment');
  });

  it(`should successfully transition RUNNING -> CONFIGURED by clicking STOP button (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)').click());
    await waitForCoreResponse(page, reqTimeout);

    const controlAction = await page.evaluate(() => window.model.environment.itemControl);
    const environment = await page.evaluate(() => window.model.environment.item);
    const state = environment.payload.environment.state;

    assert.ok(controlAction.kind !== 'Failure', `Transition of workflow '${workflowToTest}' with revision: '${revision}' was not successful due to: ${controlAction.payload}`);
    assert.strictEqual(state, 'CONFIGURED', 'WRONG state of environment');
  });

  it(`should have one button for RESET in state CONFIGURED (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    const resetButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'CONFIGURED', `WRONG state of environment based on workflow '${workflowToTest}' with revision: '${revision}'`);
    assert.strictEqual(resetButton, 'RESET', 'Could not found button for resetting (stand-by) environment probably due to bad state of environment');
  });

  // it(`should successfully transition CONFIGURED -> STANDBY by clicking RESET button(workflow '${workflowToTest}')`, async () => {
  //   await page.waitForTimeout(5000); // Standby for 5s
  //   await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)').click());
  //   await waitForCoreResponse(page, reqTimeout);

  //   const controlAction = await page.evaluate(() => window.model.environment.itemControl);
  //   const environment = await page.evaluate(() => window.model.environment.item);
  //   const state = environment.payload.environment.state;

  //   assert.ok(controlAction.kind !== 'Failure', `Transition of workflow '${workflowToTest}' with revision: '${revision}' was not successful due to: ${controlAction.payload}`);
  //   assert.strictEqual(state, 'STANDBY');
  // });

  it(`should have one button for 'Force Shutdown' environment (workflow '${workflowToTest}')`, async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button:nth-child(3)', {timeout: 5000});
    const shutdownButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button:nth-child(3)').title);
    assert.strictEqual(shutdownButton, 'Force the shutdown of the environment');
  });

  it(`should successfully shutdown environment (workflow '${workflowToTest}') and redirect to environments page`, async () => {
    await page.waitForTimeout(5000); // Standby for 5s
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button:nth-child(2)').click());
    await waitForCoreResponse(page, reqTimeout);

    const controlAction = await page.evaluate(() => window.model.environment.itemControl);
    const location = await page.evaluate(() => window.location);

    assert.ok(controlAction.kind !== 'Failure', `Transition of workflow '${workflowToTest}' with revision: '${revision}' was not successful due to: ${controlAction.payload}`);
    assert.ok(location.search, '?page=environments', 'SHUTDOWN of environment was not successful');
  });
});

/**
 * Wait for response from AliECS Core
 * Method will check if loader is still active (requests still pending) every second
 * for a specified amount of seconds (default 90)
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
