const assert = require('assert');
const test = require('../mocha-index');

describe('`pageNewEnvironment` test-suite', () => {
  let url;
  let page;
  let calls;

  before(() => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  it('should load', async () => {
    await page.goto(url + '?page=newEnvironment', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=newEnvironment');
  });

  it('should have gotten data from `GetWorkflowTemplates`', async () => {
    assert(calls['getWorkflowTemplates'] === true);
  });

  it('should have gotten data from `ListRepos`', async () => {
    assert(calls['listRepos'] === true);
  });

  it('should successfully request and parse a list of template objects', async () => {
    const templatesMap = await page.evaluate(() => {
      return window.model.workflow.templatesMap;
    });
    const expectedMap = {
      kind: 'Success', payload:
        {'gitlab.cern.ch/kalexopo/AliECS_conf/': {master: ['prettyreadout-1']}}
    };
    assert.deepStrictEqual(templatesMap, expectedMap);
  });

  it('should successfully request and parse a list of repositories objects', async () => {
    const repositories = await page.evaluate(() => {
      return window.model.workflow.repoList;
    });
    const expectedRepositories = {
      kind: 'Success',
      payload: {
        repos: [
          {name: 'github.com/AliceO2Group/ControlWorkflows/', default: true},
          {name: 'gitlab.cern.ch/kalexopo/AliECS_conf/'}
        ]
      }
    };
    assert.deepStrictEqual(repositories, expectedRepositories);
  });

  it('should successfully create a new environment', async () => {
    //// pauza
  });
});
