/* eslint-disable max-len */
const assert = require('assert');
const test = require('./core-tests');

let url;
let page;
// const workflowToTest = 'readout-stfb';
const workflowToTest = 'sleep36s-2';

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    url = test.url;
    page = test.page;
  });

  it('should successfully load newEnvironment page', async () => {
    await page.goto(url + '?page=newEnvironment', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
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

  it('should successfully select a specified workflow from template list', async () => {
    const [button] = await page.$x(`//div/a[contains(., "${workflowToTest}")]`);
    if (button) {
      await button.click();
    } else {
      assert.ok(false, `${workflowToTest} could not be found in list of workflows`);
    }
    await page.waitFor(200);
  });

  it('should display variables (K;V) panel', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > h5:nth-child(3)', {timeout: 2000});
    const title = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > h5:nth-child(3)').innerText);
    assert.strictEqual('Environment variables', title, 'Could not find the Environments Panel');
  });

  it('should successfully request a list of FLP names', async () => {
    const flpList = await page.evaluate(() => window.model.workflow.flpList);

    assert.strictEqual(flpList.kind, 'Success', 'Could not retrieve list of FLPs from Consul');
    assert.ok(flpList.payload.length > 0, 'No FLPs were found in Consul');
  });

  it('should successfully select 1st element from the FLP selection area list', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div > a').click());
    await page.waitFor(200);
    const flps = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div > a').classList);
    assert.deepStrictEqual(flps, {0: 'menu-item', 1: 'selected'}, 'FLP was not successfully selected from the panel');
  });

  it('should successfully create a new environment', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div  > div:nth-child(2) > button').click());
    await waitForCoreResponse(page);

    const location = await page.evaluate(() => window.location);
    const queryResult = await page.evaluate(() => window.model.environment.itemNew);

    assert.strictEqual(queryResult.kind, 'NotAsked', `Environment was not created due to: ${queryResult.payload}`);
    assert.ok(location.search.includes('?page=environment&id='), 'GUI did not redirect successfully to the newly created environment. Check logs for more details');
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
