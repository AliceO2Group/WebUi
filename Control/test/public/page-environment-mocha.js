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
const test = require('../mocha-index');

describe('`pageEnvironment` test-suite', async () => {
  let url;
  let page;
  let calls;

  before(() => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });
  });

  beforeEach(() => {
    // reset grpc calls
    calls['controlEnvironment'] = undefined;
    calls['getEnvironment'] = undefined;
    calls['destroyEnvironment'] = undefined;
  });

  it('should successfully load and request data for environment', async () => {
    await page.goto(url + '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220');
    assert.ok(calls['getEnvironment']);
  });

  it('should have one button for `Shutdown` environment', async () => {
    await page.waitForSelector('#buttonToSHUTDOWN', {timeout: 5000});
    const shutdownButton = await page.evaluate(() => document.querySelector('#buttonToSHUTDOWN').title);
    assert.strictEqual(shutdownButton, 'Shutdown environment');
  });

  describe('Check presence of buttons in CONFIGURED state', async () => {
    it('should have one button for START in state CONFIGURED', async () => {
      await page.waitForSelector('#buttonToSTART', {timeout: 5000});
      const startButton = await page.evaluate(() => document.querySelector('#buttonToSTART').title);
      assert.strictEqual(startButton, 'START');
    });

    it('should have one button hidden for STOP in state CONFIGURED', async () => {
      await page.waitForSelector('#buttonToSTOP', {timeout: 5000});
      const stopButtonTitle = await page.evaluate(() => document.querySelector('#buttonToSTOP').title);
      const stopButtonStyle = await page.evaluate(() => document.querySelector('#buttonToSTOP').style);
      assert.strictEqual(stopButtonTitle, `'STOP' cannot be used in state 'CONFIGURED'`);
      assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for CONFIGURE in state CONFIGURED', async () => {
      await page.waitForSelector('#buttonToCONFIGURE', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('#buttonToCONFIGURE').title);
      const configureButtonStyle = await page.evaluate(() => document.querySelector('#buttonToCONFIGURE').style);
      assert.strictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'CONFIGURED'`);
      assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
    });

    // it('should have one button for RESET in state CONFIGURED', async () => {
    //   await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > button:nth-child(4)', {timeout: 5000});
    //   const configuredStateButtons = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) >div >div >div >div >button:nth-child(4)').title);
    //   assert.strictEqual(configuredStateButtons, 'RESET');
    // });
  });

  describe('Check transition from CONFIGURED to RUNNING and presence of buttons in RUNNING state', async () => {
    it('should click START button to move states (CONFIGURED -> RUNNING)', async () => {
      await page.waitForSelector('#buttonToSTART', {timeout: 5000});
      await page.evaluate(() => document.querySelector('#buttonToSTART').click());
      await page.waitForTimeout(200);
      const state = await page.evaluate(() => {
        return window.model.environment.item.payload.state;
      });
      assert.strictEqual(state, 'RUNNING');
      assert.ok(calls['controlEnvironment']);
    });

    it('should have one button hidden for START in state RUNNING', async () => {
      await page.waitForSelector('#buttonToSTART', {timeout: 5000});
      const startButtonTitle = await page.evaluate(() => document.querySelector('#buttonToSTART').title);
      const startButtonStyle = await page.evaluate(() => document.querySelector('#buttonToSTART').style);
      assert.strictEqual(startButtonTitle, `'START' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(startButtonStyle, {0: 'display'});
    });

    it('should have one button for STOP in state RUNNING', async () => {
      await page.waitForSelector('#buttonToSTOP', {timeout: 5000});
      const stopButton = await page.evaluate(() => document.querySelector('#buttonToSTOP').title);
      assert.strictEqual(stopButton, 'STOP');
    });

    it('should have one button hidden for CONFIGURE in state RUNNING', async () => {
      await page.waitForSelector('#buttonToCONFIGURE', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('#buttonToCONFIGURE').title);
      const configureButtonStyle = await page.evaluate(() => document.querySelector('#buttonToCONFIGURE').style);
      assert.strictEqual(configureButtonTitle, `'CONFIGURE' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(configureButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for RESET in state RUNNING', async () => {
      await page.waitForSelector('#buttonToRESET', {timeout: 5000});
      const resetButtonTitle = await page.evaluate(() => document.querySelector('#buttonToRESET').title);
      const resetButtonStyle = await page.evaluate(() => document.querySelector('#buttonToRESET').style);
      assert.strictEqual(resetButtonTitle, `'RESET' cannot be used in state 'RUNNING'`);
      assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
    });
  });

  describe('Check transition from RUNNING to CONFIGURED to DEPLOYED and presence of buttons', async () => {
    it('should click STOP then RESET button states (RUNNING -> CONFIGURED -> DEPLOYED)', async () => {
      await page.waitForSelector('#buttonToSTOP', {timeout: 5000});
      // click STOP
      await page.evaluate(() => document.querySelector('#buttonToSTOP').click());
      await page.waitForTimeout(200);
      const configuredState = await page.evaluate(() => {
        return window.model.environment.item.payload.state;
      });
      assert.strictEqual(configuredState, 'CONFIGURED');
      // click RESET
      await page.evaluate(() => document.querySelector('#buttonToRESET').click());
      await page.waitForTimeout(200);
      const standbyState = await page.evaluate(() => {
        return window.model.environment.item.payload.state;
      });
      assert.strictEqual(standbyState, 'DEPLOYED');
    });

    it('should have one button hidden for START in state DEPLOYED', async () => {
      await page.waitForSelector('#buttonToSTART', {timeout: 5000});
      const startButtonTitle = await page.evaluate(() => document.querySelector('#buttonToSTART').title);
      const startButtonStyle = await page.evaluate(() => document.querySelector('#buttonToSTART').style);
      assert.strictEqual(startButtonTitle, `'START' cannot be used in state 'DEPLOYED'`);
      assert.deepStrictEqual(startButtonStyle, {0: 'display'});
    });

    it('should have one button hidden for STOP in state DEPLOYED', async () => {
      await page.waitForSelector('#buttonToSTOP', {timeout: 5000});
      const stopButtonTitle = await page.evaluate(() => document.querySelector('#buttonToSTOP').title);
      const stopButtonStyle = await page.evaluate(() => document.querySelector('#buttonToSTOP').style);
      assert.strictEqual(stopButtonTitle, `'STOP' cannot be used in state 'DEPLOYED'`);
      assert.deepStrictEqual(stopButtonStyle, {0: 'display'});
    });

    it.skip('should have one button for CONFIGURE in state DEPLOYED', async () => {
      // skipping due to OCTRL-628
      await page.waitForSelector('#buttonToCONFIGURE', {timeout: 5000});
      const configureButtonTitle = await page.evaluate(() => document.querySelector('#buttonToCONFIGURE').title);
      assert.strictEqual(configureButtonTitle, `CONFIGURE`);
    });

    it('should have one button hidden for RESET in state DEPLOYED', async () => {
      await page.waitForSelector('#buttonToRESET', {timeout: 5000});
      const resetButtonTitle = await page.evaluate(() => document.querySelector('#buttonToRESET').title);
      const resetButtonStyle = await page.evaluate(() => document.querySelector('#buttonToRESET').style);
      assert.strictEqual(resetButtonTitle, `'RESET' cannot be used in state 'DEPLOYED'`);
      assert.deepStrictEqual(resetButtonStyle, {0: 'display'});
    });
  });

  describe('Check shutdown of environment and presence of buttons', async () => {
    it('should successfully `Shutdown` environment and redirect to `pageEnvironments`', async () => {
      page.on('dialog', async (dialog) => {
        await dialog.accept();
      });
      await page.waitForSelector('#buttonToSHUTDOWN', {timeout: 5000});
      await page.evaluate(() => document.querySelector('#buttonToSHUTDOWN').click());
      await page.waitForTimeout(200);
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=environments');
      assert.ok(calls['destroyEnvironment']);
    });
  });

  describe('Utils within Environment class', async () => {
    it('should replace task name if regex is matched', async () => {
      const tagModified = await page.evaluate(() => {
        const result = {environment: {}};
        result.tasks = [{name: 'github.com/AliceO2Group/ControlWorkflows/tasks/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a'}];
        return window.model.environment._parseEnvResult(result).tasks[0].name;
      });
      assert.strictEqual(tagModified, 'readout');
    });
    it('should not replace task name due to regex not matching the name (missing tasks/ group)', async () => {
      const tagModified = await page.evaluate(() => {
        const result = {environment: {}};
        result.tasks = [{name: 'github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a'}];
        return window.model.environment._parseEnvResult(result).tasks[0].name;
      });
      assert.strictEqual(tagModified, 'github.com/AliceO2Group/ControlWorkflows/readout@4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
    });

    it('should not replace task name due to regex not matching the name (missing @ character)', async () => {
      const tagModified = await page.evaluate(() => {
        const result = {environment: {}};
        result.tasks = [{name: 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a'}];
        return window.model.environment._parseEnvResult(result).tasks[0].name;
      });
      assert.strictEqual(tagModified, 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a');
    });

    it('should successfully add mesosStdout if available in tasks', async () => {
      const mesosStdout = await page.evaluate(() => {
        const result = {environment: {}};
        result.tasks = [{mesosStdout: 'location/location', name: 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a'}];
        return window.model.environment._parseEnvResult(result).mesosStdout;
      });
      assert.strictEqual(mesosStdout, 'location/location');
    });

    it('should successfully add mesosStdout empty if not available in tasks', async () => {
      const mesosStdout = await page.evaluate(() => {
        const result = {environment: {}};
        result.tasks = [{name: 'github.com/AliceO2Group/ControlWorkflows/tasks/readout4726d80d4bf43fe65133d20d83831752049c8dbe#54c7c9b0-ffbe-11e9-97fb-02163e018d4a'}];
        return window.model.environment._parseEnvResult(result).mesosStdout;
      });
      assert.strictEqual(mesosStdout, '');
    });

    it('should filter out variables which do not belong to a detector', async () => {
      const env = await page.evaluate(() => {
        const result = {
          tasks: [],
          includedDetectors: ['ODC'],
          userVars: {
            odc_enabled: 'true',
            mid_enabled: 'false',
            mid_something: 'test',
            dd_enabled: 'true',
            run_type: 'run'
          },
          vars: {
            odc_enabled: 'true',
            mid_enabled: 'false',
            other_useful_var: 'very',
            dd_enabled: 'true',
            run_type: 'run'
          },
          defaults: {
            dcs_topology: 'test',
            dd_enabled: 'true',
            run_type: 'run'
          }
        };
        return window.model.environment._parseEnvResult(result);
      });
      assert.deepStrictEqual(env.vars, {odc_enabled: 'true', dd_enabled: 'true', run_type: 'run', other_useful_var: 'very'});
      assert.deepStrictEqual(env.userVars, {odc_enabled: 'true', dd_enabled: 'true', run_type: 'run'});
      assert.deepStrictEqual(env.defaults, {dd_enabled: 'true', run_type: 'run'});
    })
  });
});
