const assert = require('assert');
const test = require('../mocha-index');

describe('`pageEnvironment` test-suite', () => {
  let url;
  let page;
  let calls;

  before(() => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  it('should load', async () => {
    await page.goto(url + '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220');
  });

  it('should have gotten data from getEnvironment', async () => {
    assert(calls['getEnvironment'] === true);
  });

  it('should have one button for locking', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
    const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    assert.deepStrictEqual(lockButton, 'Lock is free');
  });

  // LOCK Actions
  it('should click START button and do nothing due to `Control is not locked`', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
    await page.waitFor(2000);
    const state = await page.evaluate(() => {
      return window.model.environment.itemControl.payload;
    });
    assert.deepStrictEqual(state, 'Request to server failed (403 Forbidden): Control is not locked');
  });

  it('should click LOCK button', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
    await page.waitFor(500);
    const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    assert.deepStrictEqual(lockButton, 'Lock is taken by Anonymous (id 0)');
  });

  // CONFIGURED STATE
  it('should have one button for START in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    const startButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(1)').title);
    assert.deepStrictEqual(startButton, 'START');
  });

  it('should have one button hidden for STOP in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    const stopButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(2)').title);
    const stopButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(2)').style);
    assert.deepStrictEqual(stopButtonTitle, `'STOP' cannot be used in state 'CONFIGURED'`);
    assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
  });

  it('should have one button hidden for CONFIGURE in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
    const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(3)').title);
    const configureButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(3)').style);
    assert.deepStrictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'CONFIGURED'`);
    assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
  });

  it('should have one button for RESET in state CONFIGURED', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    const configuredStateButtons = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(4)').title);
    assert.deepStrictEqual(configuredStateButtons, 'RESET');
  });

  // RUNNING STATE
  it('should click START button to move states (CONFIGURED -> RUNNING)', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)').click());
    await page.waitFor(200);
    const state = await page.evaluate(() => {
      return window.model.environment.item.payload.environment.state;
    });
    assert.deepStrictEqual(state, 'RUNNING');
  });

  it('should have gotten data from controlEnvironment', async () => {
    assert(calls['controlEnvironment'] === true);
  });

  it('should have one button hidden for START in state RUNNING', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    const startButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').title);
    const startButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').style);
    assert.deepStrictEqual(startButtonTitle, `'START' cannot be used in state 'RUNNING'`);
    assert.deepStrictEqual(startButtonStyle, {0: 'display'});
  });

  it('should have one button for STOP in state RUNNING', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    const stopButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
    assert.deepStrictEqual(stopButton, 'STOP');
  });

  it('should have one button hidden for CONFIGURE in state RUNNING', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
    const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').title);
    const configureButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').style);
    assert.deepStrictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'RUNNING'`);
    assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
  });

  it('should have one button hidden for RESET in state RUNNING', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    const resetButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
    const resetButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').style);
    assert.deepStrictEqual(resetButtonTitle, `'RESET' cannot be used in state 'RUNNING'`);
    assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
  });

  // STANDBY STATE

  it('should click STOP then RESET button states (RUNNING -> CONFIGURED -> STANDBY)', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    // click STOP
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)').click());
    await page.waitFor(200);
    const configuredState = await page.evaluate(() => {
      return window.model.environment.item.payload.environment.state;
    });
    assert.deepStrictEqual(configuredState, 'CONFIGURED');
    // click RESET
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)').click());
    await page.waitFor(200);
    const standbyState = await page.evaluate(() => {
      return window.model.environment.item.payload.environment.state;
    });
    assert.deepStrictEqual(standbyState, 'STANDBY');
  });

  it('should have one button hidden for START in state STANDBY', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(1)', {timeout: 5000});
    const startButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').title);
    const startButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(1)').style);
    assert.deepStrictEqual(startButtonTitle, `'START' cannot be used in state 'STANDBY'`);
    assert.deepStrictEqual(startButtonStyle, {0: 'display'});
  });

  it('should have one button hidden for STOP in state STANDBY', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(2)', {timeout: 5000});
    const stopButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').title);
    const stopButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(2)').style);
    assert.deepStrictEqual(stopButtonTitle, `'STOP' cannot be used in state 'STANDBY'`);
    assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
  });

  it('should have one button hidden for CONFIGURE in state STANDBY', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(3)', {timeout: 5000});
    const configureButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(3)').title);
    assert.deepStrictEqual(configureButtonTitle, `CONFIGURE`);
  });

  it('should have one button hidden for RESET in state STANDBY', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    const resetButtonTitle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').title);
    const resetButtonStyle = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div >button:nth-child(4)').style);
    assert.deepStrictEqual(resetButtonTitle, `'RESET' cannot be used in state 'STANDBY'`);
    assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
  });

  it('should click LOCK button to remove control', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
    await page.waitFor(500);
    const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    assert.deepStrictEqual(lockButton, 'Lock is free');
  });
});
