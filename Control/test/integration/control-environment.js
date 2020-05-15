/* eslint-disable max-len */
const assert = require('assert');
const test = require('./core-tests');

let page;
let requestTimeout;

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    page = test.page;
    requestTimeout = test.requestTimeout ? test.requestTimeout : 90;
  });

  it('should be on page of new environment just created', async () => {
    const location = await page.evaluate(() => window.location);
    assert.ok(location.search.includes('?page=environment&id='));
  });

  it('should have one button for START in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    const startButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(1)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'CONFIGURED', 'WRONG state of environment');
    assert.strictEqual(startButton, 'START', 'Could not found button for starting environment probably due to bad state of environment');
  });

  it('should successfully transition CONFIGURED -> RUNNING by clicking START button', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
    await waitForCoreResponse(page, requestTimeout);

    const environment = await page.evaluate(() => window.model.environment.item);
    const state = environment.payload.environment.state;

    assert.strictEqual(environment.kind, 'Success', `Transition was not successful due to: ${environment.payload}`);
    assert.strictEqual(state, 'RUNNING', 'Environment was expected to be running');
  });

  it('should have one button for STOP in state RUNNING', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    const stopButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'RUNNING', 'WRONG state of environment');
    assert.strictEqual(stopButton, 'STOP', 'Could not found button for stopping environment probably due to bad state of environment');
  });

  it('should successfully transition RUNNING -> CONFIGURED by clicking STOP button', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)').click());
    await waitForCoreResponse(page, requestTimeout);

    const environment = await page.evaluate(() => window.model.environment.item);
    const state = environment.payload.environment.state;

    assert.strictEqual(environment.kind, 'Success', `Transition was not successful due to: ${environment.payload}`);
    assert.strictEqual(state, 'CONFIGURED', 'WRONG state of environment');
  });

  it('should have one button for RESET in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    const resetButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
    const state = await page.evaluate(() => window.model.environment.item.payload.environment.state);

    assert.strictEqual(state, 'CONFIGURED', 'WRONG state of environment');
    assert.strictEqual(resetButton, 'RESET', 'Could not found button for resetting (stand-by) environment probably due to bad state of environment');
  });

  it('should successfully transition CONFIGURED -> STANDBY by clicking RESET button', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)').click());
    await waitForCoreResponse(page, requestTimeout);

    const environment = await page.evaluate(() => window.model.environment.item);
    const state = environment.payload.environment.state;

    assert.strictEqual(environment.kind, 'Success', `Transition was not successful due to: ${environment.payload}`);
    assert.strictEqual(state, 'STANDBY');
  });

  it('should have one button for `Shutdown` environment', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button', {timeout: 5000});
    const shutdownButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button').title);
    assert.strictEqual(shutdownButton, 'Shutdown environment');
  });

  it('should successfully shutdown environment and redirect to environments page', async () => {
    // await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button', {timeout: 5000});
    // const shutdownButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(2) > button').title);
    // assert.strictEqual(shutdownButton, 'Shutdown environment');
    await page.waitFor(requestTimeout);
    const location = await page.evaluate(() => window.location);
    assert.ok(location.search, '?page=environments', 'SHUTDOWN of environment was not successful');
    // envID = location.search.split('&id=')[1];
  });
});

/**
 * Wait for response from AliECS Core
 * Method will check if loader is still active (requests still pending) every second for 90 seconds
 * @param {Object} page
 * @return {Promise}
 */
const waitForCoreResponse = async (page) => {
  return new Promise(async (resolve) => {
    let i = 0;
    while (i++ < 90) {
      const isLoaderActive = await page.evaluate(() => window.model.loader.active);
      if (!isLoaderActive) {
        resolve();
      } else {
        await page.waitFor(1000);
      }
    }
  });
};