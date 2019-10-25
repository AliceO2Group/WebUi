const assert = require('assert');
const test = require('../mocha-index');

describe('`pageEnvironments` test-suite', () => {
  let url;
  let page;
  let calls;

  before(() => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  beforeEach(() => {
    // reset grpc calls
    calls['getEnvironments'] = undefined;
  });

  it('should load', async () => {
    await page.goto(url + '?page=environments', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=environments');
    assert(calls['getEnvironments'] === true);
  });
});
