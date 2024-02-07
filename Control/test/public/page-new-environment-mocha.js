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

let url;
let page;
let calls;
let apricotCalls;

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
    apricotCalls = test.helpers.apricotCalls;
    await page.setRequestInterception(true);
    page.on('request', getFLPList);
  });

  after(async () => {
    await page.setRequestInterception(false);
    await page.removeListener('request', getFLPList);
  });

  beforeEach(() => {
    // reset grpc calls
    calls['getWorkflowTemplates'] = undefined;
    calls['listRepos'] = undefined;
    calls['getEnvironments'] = undefined;
    calls['getEnvironment'] = undefined;
    calls['newEnvironment'] = undefined;
    apricotCalls['listDetectors'] = undefined;
    apricotCalls['listRuntimeEntries'] = undefined;
    apricotCalls['setRuntimeEntry'] = undefined;
    calls['getActiveDetectors'] = undefined;
  });

  it('should successfully load newEnvironmentAdvanced page and needed resources', async () => {
    await page.goto(url + '?page=newEnvironmentAdvanced', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=newEnvironmentAdvanced');
    assert.ok(calls['getWorkflowTemplates']);
    assert.ok(calls['listRepos']);
    assert.ok(calls['getActiveDetectors']);
  });

  it('should verify default role', async () => {
    const role = await page.evaluate(() => window.model.session.role);
    assert.strictEqual(role, 1);
  });

  it('should successfully display warning message that Guest cannot create environments', async () => {
    await page.evaluate(() => {
      window.model.session.role = 4;
      window.model.notify();
    });
    await page.waitForTimeout(100);

    const text = await page.evaluate(() => document.querySelector('.m4').innerText);
    assert.strictEqual(text, 'You are not allowed to create environments.');

    await page.evaluate(() => {
      window.model.session.role = 1;
      window.model.notify();
    });
  });

  it('should successfully request and parse a list of template objects', async () => {
    const templates = await page.evaluate(() => window.model.workflow.templates);
    const expectedTemplates = [{name: 'prettyreadout-1', description: 'something'}];

    assert.strictEqual(templates.kind, "Success");
    assert.deepStrictEqual(templates.payload, expectedTemplates);
  });

  it('should successfully request and parse a list of repositories objects', async () => {
    const repositories = await page.evaluate(() => window.model.workflow.repoList);
    const expectedRepositories = {
      repos: [
        {name: 'git.cern.ch/some-user/some-repo/', default: true, defaultRevision: 'dev', revisions: ['master', 'dev']},
        {name: 'git.com/alice-user/alice-repo/', revisions: []},
      ],
    };

    assert.strictEqual(repositories.kind, 'Success');
    assert.deepStrictEqual(repositories.payload, expectedRepositories);
  });

  it('should successfully fill form with default revision and repo passed from core', async () => {
    const initialForm = await page.evaluate(() => window.model.workflow.form);
    delete initialForm.observers
    const expectedForm = {
      repository: 'git.cern.ch/some-user/some-repo/',
      revision: 'dev',
      template: '',
      variables: {},
      basicVariables: {},
      hosts: [],
      _detectors: [],
    };
    assert.deepStrictEqual(initialForm, expectedForm, 'Initial form was not filled correctly');
  });

  it('should have `Create` button disabled due to no selected workflow', async () => {
    await page.waitForSelector('#create-env');
    const button = await page.evaluate(() => {
      const button = document.querySelector('#create-env');
      return {title: button.title, classList: button.classList, disabled: button.disabled};
    });
    assert.strictEqual(button.title, 'Create environment based on selected workflow');
    assert.ok(button.disabled);
    assert.deepStrictEqual(button.classList, {0: 'btn', 1: 'btn-primary'});
  });

  it('should successfully select a workflow from template list initially', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
    await page.waitForTimeout(200);
    const selectedWorkflow = await page.evaluate(() => {
      const element = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      return {classList: element.classList};
    });

    assert.deepStrictEqual(selectedWorkflow.classList, {0: 'w-90', 1: 'menu-item', 2: 'w-wrapped', 3: 'selected'});
  });

  it('should have `Create` button disabled due to no selected detectors', async () => {
    await page.waitForSelector('#create-env');
    const button = await page.evaluate(() => {
      const button = document.querySelector('#create-env');
      const selected = window.model.workflow.flpSelection.selectedDetectors.length;
      return {disabled: button.disabled, noSelected: selected};
    });
    assert.ok(button.noSelected || button.disabled);
  });

  it('should successfully display `Refresh repositories` button', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div > div > div > button', {timeout: 5000});
    const refreshRepositoriesButtonTitle = await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div > div > div > button').title);
    assert.deepStrictEqual(refreshRepositoriesButtonTitle, 'Update Workflow Templates');
  });

  it('should successfully select second repository from dropdown', async () => {
    const selectedRepository = await page.select('select', 'git.com/alice-user/alice-repo/');
    await page.waitForTimeout(200);
    assert.deepStrictEqual(selectedRepository, ['git.com/alice-user/alice-repo/']);
  });

  it('should have error of missing revisions for this repository', async () => {
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector(
        'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div > div');
      return {text: errorElement.innerText};
    });
    assert.strictEqual(errorMessage.text.trim(), 'No revisions found for the selected repository');
  });

  it('should successfully request refresh of repositories and request repositories list, its contents and branches again', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div > div > div > div > button').click());
    await page.waitForTimeout(1000);
    assert.ok(calls['refreshRepos']);
    assert.ok(calls['getWorkflowTemplates']);
    assert.ok(calls['listRepos']);
  });

  it('should successfully select a workflow from template list', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
    await page.waitForTimeout(200);
    const selectedWorkflow = await page.evaluate(() => {
      const element = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      return {classList: element.classList};
    });
    assert.deepStrictEqual(selectedWorkflow.classList, {0: 'w-90', 1: 'menu-item', 2: 'w-wrapped', 3: 'selected'});
  });

  it('should successfully select EPN ON from GeneralConfiguration and automatically set DD & DD Sched to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="epnOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `EPN ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'true', dd_enabled: 'true', ddsched_enabled: 'true'}, 'odc_enabled, dd_enabled or ddsched_enabled could not be found in basic variables selection set to true');
  });

  it('should successfully select DD OFF from GeneralConfiguration and automatically set EPN, DD, DDSCHED, QC to OFF', async () => {
    const [label] = await page.$x(`//div/input[@id="dataDistributionOff"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `Data Distribution OFF label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', ddsched_enabled: 'false', dd_enabled: 'false', qcdd_enabled: 'false', minimal_dpl_enabled: 'false'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select QC ON from GeneralConfiguration and automatically set DD to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="qcddOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `Quality Control ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', dd_enabled: 'true', ddsched_enabled: 'false', qcdd_enabled: 'true', minimal_dpl_enabled: 'false'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select DPL Minimal ON from GeneralConfiguration and automatically set QC to OFF and keep DD set to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="dplMwOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `DPL Minimal ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', dd_enabled: 'true', ddsched_enabled: 'false', qcdd_enabled: 'false', minimal_dpl_enabled: 'true'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select DD OFF from GeneralConfiguration and automatically set QC, dpl, dd_sched to OFF', async () => {
    const [label] = await page.$x(`//div/input[@id="dataDistributionOff"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `DD OFF label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', dd_enabled: 'false', ddsched_enabled: 'false', qcdd_enabled: 'false', minimal_dpl_enabled: 'false'});
  });

  it('should successfully select option file:// from dropdown and input box should appear', async () => {
    await page.select('select#readoutURISelection', 'file://');
    await page.waitForTimeout(200);
    const readoutUriPrefix = await page.evaluate(() => window.model.workflow.form.basicVariables.readout_cfg_uri_pre);
    assert.strictEqual(readoutUriPrefix, 'file://');
  });

  it('should successfully fill in readout uri from typed text', async () => {
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div > div > div:nth-child(6) > div > div:nth-child(2) > div:nth-child(2) > input');
    await page.keyboard.type('file-readout');
    await page.waitForTimeout(200);
    const variables = await page.evaluate(() => window.model.workflow.form.basicVariables);

    assert.strictEqual(variables.readout_cfg_uri, 'file-readout');
  });

  it('should display variables (K;V) panel', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > div', {timeout: 2000});
    const title = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > div > div:nth-child(2) > div:nth-child(2) > div').innerText);
    assert.strictEqual('Advanced Configuration', title);
  });

  it('should successfully add trimmed pair (K;V) to variables by pressing enter key', async () => {
    await page.focus('#keyInputField');
    await page.keyboard.type('TestKey   ');
    await page.waitForTimeout(200);

    await page.focus('#valueTextAreaField');
    await page.keyboard.type(' TestValue  ');
    await page.waitForTimeout(200);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const variables = await page.evaluate(() => {
      return window.model.workflow.form.variables;
    });
    assert.deepStrictEqual(variables['TestKey'], 'TestValue');
  });

  it('should successfully move focus to key input after KV pair was added', async () => {
    const hasFocus = await page.evaluate(() => document.activeElement.id === 'keyInputField');
    assert.strictEqual(hasFocus, true, 'Key Input field was not focused after key insertion')
  });

  it('should successfully add second pair (K;V) to variables by pressing iconPlus', async () => {
    await page.focus('#keyInputField');
    await page.keyboard.type('TestKey2');
    await page.waitForTimeout(200);

    await page.focus('#valueTextAreaField');
    await page.keyboard.type('TestValue2');
    await page.waitForTimeout(200);

    const variables = await page.evaluate(() => {
      document.querySelector('#addKVPairButton').click();
      return window.model.workflow.form.variables;
    });

    assert.deepStrictEqual(variables['TestKey2'], 'TestValue2');
  });

  it('should successfully move focus to key input after KV pair was added', async () => {
    const hasFocus = await page.evaluate(() => document.activeElement.id === 'keyInputField');
    assert.strictEqual(hasFocus, true, 'Key Input field was not focused after key insertion')
  });

  it('should successfully remove first pair (K;V) from variables by pressing red iconTrash', async () => {
    await page.evaluate(() => {
      document.querySelector('#removeKeyTestKey').click();
    });
    await page.waitForTimeout(200);
    const variables = await page.evaluate(() => window.model.workflow.form.variables);

    const expectedVars = {TestKey2: 'TestValue2'};
    assert.deepStrictEqual(variables, expectedVars);
    const classList = await page.evaluate(() => document.querySelector('#removeKeyTestKey2').classList);
    assert.deepStrictEqual({0: 'ph2', 1: 'danger', 2: 'actionable-icon'}, classList);
  });

  it('should successfully add a JSON with (K;V) pairs in advanced configuration panel', async () => {
    await page.focus('#kvTextArea');
    await page.keyboard.type('{"testJson": "JsonValue"}');
    await page.waitForTimeout(2000);
    const variables = await page.evaluate(() => {
      document.querySelector('#addKVListButton').click();
      return window.model.workflow.form.variables;
    });
    await page.waitForTimeout(200);
    const expectedVariables = {TestKey2: 'TestValue2', testJson: 'JsonValue'};
    assert.strictEqual(JSON.stringify(variables), JSON.stringify(expectedVariables));
  });

  it('should not add a JSON with (K;V) pairs if it is not JSON formatted and text area should keep the wrong JSON to allow user to edit', async () => {
    const currentVariables = await page.evaluate(() => window.model.workflow.form.variables);
    await page.focus('#kvTextArea');
    const toBeTyped = '{"testJson": "JsonValue", somtest: test}';
    await page.keyboard.type('{"testJson": "JsonValue", somtest: test}');
    await page.waitForTimeout(200);

    await page.evaluate(() => document.querySelector('#addKVListButton').click())
    const {variables, areaString} = await page.evaluate(() => {
      return {variables: window.model.workflow.form.variables, areaString: window.model.workflow.kvPairsString};
    });
    assert.deepStrictEqual(variables, currentVariables, 'diff vars');
    assert.strictEqual(areaString, toBeTyped, 'dif area')
  });

  it('should successfully move focus to key input after KV pair was added', async () => {
    const hasFocus = await page.evaluate(() => document.activeElement.id === 'kvTextArea');
    assert.strictEqual(hasFocus, true, 'KV TextArea was not focused after JSON insertion')
  });

  // FLP Selection

  it('should successfully request a list of detectors', async () => {
    const detectors = await page.evaluate(() => window.model.workflow.flpSelection.detectors);
    const expDetectors = ['MID', 'DCS', 'ODC'];

    assert.strictEqual(detectors.kind, "Success");
    assert.deepStrictEqual(detectors.payload, expDetectors, 'Missing detectors');
  });

  it('should successfully request a list of ACTIVE detectors', async () => {
    const activeDetectors = await page.evaluate(() => window.model.workflow.flpSelection.activeDetectors);
    const expActiveDetectors = {detectors: ['DCS']};

    assert.strictEqual(activeDetectors.kind, 'Success');
    assert.deepStrictEqual(activeDetectors.payload, expActiveDetectors, 'Missing active detectors');
  });

  it('should successfully disable active detectors from the list', async () => {
    const detectorClass = await page.evaluate(() => document.querySelector('.m1 > div:nth-child(2) > div > a:nth-child(2)').classList);
    assert.ok(Object.values(detectorClass).includes('menu-item'));
    assert.ok(Object.values(detectorClass).includes('disabled-item'));
  });

  it('should have an empty list of hosts before detector selection', async () => {
    const flps = await page.evaluate(() => window.model.workflow.flpSelection.list);
    assert.strictEqual(flps.kind, 'NotAsked');
  });

  it('should not select a detector that is not locked', async () => {
    await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > div > a:nth-child(2)').click()); // second element is for detector, first for lock
    await page.waitForTimeout(200);

    const selectedDet = await page.evaluate(() => window.model.workflow.flpSelection.selectedDetectors);
    assert.ok(selectedDet.length == 0, 'Detector selected without lock');
  });

  it('should successfully lock, select a detector and request a list of hosts for that detector', async () => {
    await page.waitForSelector('.m1 > div:nth-child(1) > div > a:nth-child(1)');
    await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > div > a:nth-child(1)').click());
    await page.waitForTimeout(200);

    await page.waitForSelector('.m1 > div:nth-child(1) > div > a:nth-child(2)');
    await page.evaluate(() => document.querySelector('.m1 > div:nth-child(1) > div > a:nth-child(2)').click());
    await page.waitForTimeout(200);

    const selectedDet = await page.evaluate(() => window.model.workflow.flpSelection.selectedDetectors);
    assert.deepStrictEqual(selectedDet, ['MID'], 'Missing detector selection');
    await page.waitForTimeout(500);
  });

  it('should successfully have a list of FLPs after detector selection', async () => {
    assert.ok(apricotCalls['getHostInventory']);
    const flps = await page.evaluate(() => window.model.workflow.flpSelection.list.payload);
    assert.deepStrictEqual(flps, ['ali-flp-22', 'ali-flp-23']);
  });

  it('should successfully preselect hosts for selected detector', async () => {
    const flps = await page.evaluate(() => window.model.workflow.form.hosts);
    assert.deepStrictEqual(flps, ['ali-flp-22', 'ali-flp-23']);
  });

  it.skip('should successfully save configuration', async () => {
    page.on('dialog', async dialog => {
      await dialog.accept('My Config');
    });
    await page.evaluate(() => document.querySelector('#save-core-env-config').click());
    await page.waitForTimeout(200)

    const message = await page.evaluate(() => window.model.environment.itemNew.payload);
    assert.ok(apricotCalls['setRuntimeEntry']);
    assert.ok(apricotCalls['listRuntimeEntries']);
    assert.strictEqual(message, 'Configuration saved successfully as My_Config');
  });

  it('should successfully create a new environment', async () => {
    await page.evaluate(() => document.querySelector('#create-env').click());
    await page.waitForTimeout(1000);
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=environments');
  });

  it('should display successful environment request', async () => {
    await page.waitForSelector('tr.primary > th:nth-child(1)');
    const detector = await page.evaluate(() => document.querySelector('table.table:nth-child(4) > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(2)').innerText);
    const state = await page.evaluate(() => document.querySelector('table.table:nth-child(4) > tbody:nth-child(2) > tr:nth-child(1) > td:nth-child(6)').innerText);
    assert.strictEqual(detector, 'MID');
    assert.strictEqual(state, 'ONGOING');
  });

  /**
   * Method intercept consul request and return 200
   * @param {Request} request
   */
  function getFLPList(request) {
    if (request.url().includes('/api/consul/flps')) {
      request.respond({
        status: 200, contentType: 'application/json', body: JSON.stringify({
          flps: ['alio2-cr1-flp134', 'alio2-cr1-flp136', 'alio2-cr1-flp137'],
          readoutPath: 'localhost:8500/some/readout/path',
        }),
      });
    } else {
      request.continue();
    }
  }
});
