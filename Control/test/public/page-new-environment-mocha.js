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

describe('`pageNewEnvironment` test-suite', async () => {
  before(async () => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
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
  });

  it('should successfully load newEnvironment page and needed resources', async () => {
    await page.goto(url + '?page=newEnvironment', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=newEnvironment');
    assert.ok(calls['getWorkflowTemplates']);
    assert.ok(calls['listRepos']);
  });

  it('should successfully request and parse a list of template objects', async () => {
    const templates = await page.evaluate(() => window.model.workflow.templates);
    const expectedTemplates = {
      kind: 'Success', payload:
        ['prettyreadout-1']
    };
    assert.deepStrictEqual(templates, expectedTemplates);
  });

  it('should successfully request and parse a list of repositories objects', async () => {
    const repositories = await page.evaluate(() => window.model.workflow.repoList);
    const expectedRepositories = {
      kind: 'Success',
      payload: {
        repos: [
          {name: 'git.cern.ch/some-user/some-repo/', default: true, defaultRevision: 'dev', revisions: ['master', 'dev']},
          {name: 'git.com/alice-user/alice-repo/', revisions: []}
        ]
      }
    };
    assert.deepStrictEqual(repositories, expectedRepositories);
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
      hosts: []
    };
    assert.deepStrictEqual(initialForm, expectedForm, 'Initial form was not filled correctly');
  });

  it('should have `Create` button disabled due to no selected workflow', async () => {
    const button = await page.evaluate(() => {
      const button = document.querySelector(
        'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > button');
      return {title: button.title, classList: button.classList, disabled: button.disabled};
    });
    assert.strictEqual(button.title, 'Create environment based on selected workflow');
    assert.ok(button.disabled);
    assert.deepStrictEqual(button.classList, {0: 'btn', 1: 'btn-primary'});
  });

  it('should successfully select a workflow from template list initially', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
    await page.waitForTimeout(200);
    const selectedWorkflow = await page.evaluate(() => {
      const element = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      return {classList: element.classList};
    });

    assert.deepStrictEqual(selectedWorkflow.classList, {0: 'w-90', 1: 'menu-item', 2: 'w-wrapped', 3: 'selected'});
  });

  it('should throw error when `Create` button is clicked due to `Control is not locked`', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > button').click());
    await page.waitForTimeout(500);
    const errorOnCreation = await page.evaluate(() => window.model.environment.itemNew);
    assert.strictEqual(errorOnCreation.kind, 'Failure');
    assert.strictEqual(errorOnCreation.payload, 'Request to server failed (403 Forbidden): Control is not locked');
  });

  it('should display error message due to `Control is not locked`', async () => {
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector(
        'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(2) > p');
      return {text: errorElement.innerText, classList: errorElement.classList};
    });
    assert.strictEqual(errorMessage.text, ' Request to server failed (403 Forbidden): Control is not locked');
    assert.deepStrictEqual(errorMessage.classList, {0: 'text-center', 1: 'danger'});
  });

  it('should successfully display `Refresh repositories` button', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > button', {timeout: 5000});
    const refreshRepositoriesButtonTitle = await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > button').title);
    assert.deepStrictEqual(refreshRepositoriesButtonTitle, 'Refresh repositories');
  });

  it('should click to refresh repositories but throw error due to `Control is not locked`', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > button').click());
    await page.waitForTimeout(500);
    const errorOnRefresh = await page.evaluate(() => window.model.workflow.refreshedRepositories);
    assert.deepStrictEqual(calls['refreshRepos'], undefined);
    assert.deepStrictEqual(errorOnRefresh, {kind: 'Failure', payload: 'Request to server failed (403 Forbidden): Control is not locked'});
  });

  it('should successfully select second repository from dropdown', async () => {
    const selectedRepository = await page.select('select', 'git.com/alice-user/alice-repo/');
    await page.waitForTimeout(500);
    assert.deepStrictEqual(selectedRepository, ['git.com/alice-user/alice-repo/']);
  });

  it('should have error of missing revisions for this repository', async () => {
    const errorMessage = await page.evaluate(() => {
      const errorElement = document.querySelector(
        'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div > p');
      return {classList: errorElement.classList, text: errorElement.innerText};
    });
    assert.strictEqual(errorMessage.text.trim(), 'No revisions found for the selected repository');
    assert.deepStrictEqual(errorMessage.classList, {0: 'text-center', 1: 'danger'});
  });

  it('should successfully request LOCK', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
    await page.waitForTimeout(500);
    const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    assert.deepStrictEqual(lockButton, 'Lock is taken by Anonymous (id 0)');
  });

  it('should successfully request refresh of repositories and NOT request repositories again due to refresh action failing', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > button').click());
    await page.waitForTimeout(500);
    const errorOnRefresh = await page.evaluate(() => window.model.workflow.refreshedRepositories);
    assert.ok(calls['refreshRepos']);
    assert.deepStrictEqual(errorOnRefresh, {kind: 'Failure', payload: 'Request to server failed (504 Gateway Timeout): 2 UNKNOWN: 504: Unable to refresh repositories'});
    assert.deepStrictEqual(calls['listRepos'], undefined);
  });

  it('should successfully request refresh of repositories and request repositories list, its contents and branches again', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div > div > div > div > button').click());
    await page.waitForTimeout(1000);
    assert.ok(calls['refreshRepos']);
    assert.ok(calls['getWorkflowTemplates']);
    assert.ok(calls['listRepos']);
  });

  it('should successfully select a workflow from template list', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a').click());
    await page.waitForTimeout(200);
    const selectedWorkflow = await page.evaluate(() => {
      const element = document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div > div > div:nth-child(2) > div:nth-child(3) > div > div > a');
      return {classList: element.classList};
    });
    assert.deepStrictEqual(selectedWorkflow.classList, {0: 'w-90', 1: 'menu-item', 2: 'w-wrapped', 3: 'selected'});
  });

  it('should successfully select EPN ON from BasicConfiguration and automatically set DD & DD Sched to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="epnOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `EPN ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'true', dd_enabled: 'true', ddsched_enabled: 'true'}, 'odc_enabled, dd_enabled or ddsched_enabled could not be found in basic variables selection set to true');
  });

  it('should successfully select DD OFF from BasicConfiguration and automatically set EPN, DD, DDSCHED, QC to OFF', async () => {
    const [label] = await page.$x(`//div/input[@id="dataDistributionOff"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `Data Distribution OFF label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', ddsched_enabled: 'false', dd_enabled: 'false', qcdd_enabled: 'false', minimal_dpl_enabled: 'false'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select QC ON from BasicConfiguration and automatically set DD to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="qcddOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `Quality Control ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', dd_enabled: 'true', ddsched_enabled: 'false', qcdd_enabled: 'true', minimal_dpl_enabled: 'false'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select DPL Minimal ON from BasicConfiguration and automatically set QC to OFF and keep DD set to ON', async () => {
    const [label] = await page.$x(`//div/input[@id="dplMwOn"]`);
    if (label) {
      await label.click();
    } else {
      assert.ok(false, `DPL Minimal ON label could not be found in list of labels`);
    }
    const basicVars = await page.evaluate(() => window.model.workflow.form.basicVariables);
    assert.deepStrictEqual(basicVars, {odc_enabled: 'false', dd_enabled: 'true', ddsched_enabled: 'false', qcdd_enabled: 'false', minimal_dpl_enabled: 'true'}, 'odc_enabled or dd_enabled could not be found in basic variables selection set to false');
  });

  it('should successfully select DD OFF from BasicConfiguration and automatically set QC, dpl, dd_sched to OFF', async () => {
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
    await page.waitForTimeout(500);
    const readoutUriPrefix = await page.evaluate(() => window.model.workflow.form.basicVariables.readout_cfg_uri_pre);
    assert.strictEqual(readoutUriPrefix, 'file://');
  });

  it('should successfully fill in readout uri from typed text', async () => {
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div > div > div:nth-child(6) > div > div:nth-child(2) > div:nth-child(2) > input');
    page.keyboard.type('file-readout');
    await page.waitForTimeout(500);
    const variables = await page.evaluate(() => window.model.workflow.form.basicVariables);

    assert.strictEqual(variables.readout_cfg_uri, 'file-readout');
  });

  it('should display variables (K;V) panel', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div', {timeout: 2000});
    const title = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div').innerText);
    assert.strictEqual('Advanced Configuration', title);
  });

  it('should successfully add trimmed pair (K;V) to variables by pressing enter key', async () => {
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3)> div > div > input');
    await page.keyboard.type('TestKey   ');
    await page.waitForTimeout(200);

    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div > div:nth-child(2) > input');
    await page.keyboard.type(' TestValue  ');
    await page.waitForTimeout(200);

    await page.keyboard.type(String.fromCharCode(13));
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
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div > div > input');
    await page.keyboard.type('TestKey2');
    await page.waitForTimeout(200);

    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div > div:nth-child(2) > input');
    await page.keyboard.type('TestValue2');
    await page.waitForTimeout(200);

    const variables = await page.evaluate(() => {
      document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div >  div:nth-child(3)').click();
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
      document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3)').click();
    });
    await page.waitForTimeout(500);
    const variables = await page.evaluate(() => window.model.workflow.form.variables);

    const expectedVars = {TestKey2: 'TestValue2'};
    assert.deepStrictEqual(variables, expectedVars);
    const classList = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div:nth-child(3)').classList);
    assert.deepStrictEqual({0: 'ph2', 1: 'danger', 2: 'actionable-icon'}, classList);
  });

  it('should successfully add a JSON with (K;V) pairs in advanced configuration panel', async () => {
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(4) > div > textarea');
    await page.keyboard.type('{"testJson": "JsonValue"}');
    await page.waitForTimeout(1000);
    const variables = await page.evaluate(() => {
      document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(4) > div:nth-child(2)').click();
      return window.model.workflow.form.variables;
    });
    await page.waitForTimeout(500);
    const expectedVariables = {TestKey2: 'TestValue2', testJson: 'JsonValue'};
    assert.strictEqual(JSON.stringify(variables), JSON.stringify(expectedVariables));
  });

  it('should not add a JSON with (K;V) pairs if it is not JSON formatted and text area should keep the wrong JSON to allow user to edit', async () => {
    const currentVariables = await page.evaluate(() => window.model.workflow.form.variables);
    await page.focus('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div > div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(4) > div > textarea');
    const toBeTyped = '{"testJson": "JsonValue", somtest: test}';
    await page.keyboard.type('{"testJson": "JsonValue", somtest: test}');
    await page.waitForTimeout(500);

    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div > div >div:nth-child(2) > div:nth-child(2) > div:nth-child(3) > div:nth-child(4) > div:nth-child(2)').click())
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
  it('should successfully request a list of FLP names', async () => {
    const flpList = await page.evaluate(() => window.model.workflow.flpSelection.list);
    const expectedList = {
      kind: 'Success', payload: ['alio2-cr1-flp134', 'alio2-cr1-flp136', 'alio2-cr1-flp137']
    };
    assert.deepStrictEqual(flpList, expectedList);
  });

  it('should successfully create a new environment', async () => {
    await page.evaluate(() => document.querySelector(
      'body > div:nth-child(2) > div:nth-child(2) > div:nth-child(2) > div  > div:nth-child(2) > button').click());
    await page.waitForTimeout(1000);
    const location = await page.evaluate(() => window.location);

    assert.strictEqual(location.search, '?page=environment&id=6f6d6387-6577-11e8-993a-f07959157220');
    assert.ok(calls['newEnvironment']);
    assert.ok(calls['getEnvironment']);
  });

  it('should successfully release LOCK', async () => {
    await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
    await page.waitForTimeout(500);
    const lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    assert.deepStrictEqual(lockButton, 'Lock is free');
  });

  /**
   * Method intercept consul request and return 200
   * @param {Request} request
   */
  function getFLPList(request) {
    if (request.url().includes('/api/getFLPs')) {
      request.respond({
        status: 200, contentType: 'application/json', body: JSON.stringify({
          flps: ['alio2-cr1-flp134', 'alio2-cr1-flp136', 'alio2-cr1-flp137'],
          readoutPath: 'localhost:8500/some/readout/path'
        })
      });
    } else {
      request.continue();
    }
  }
});
