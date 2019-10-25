const assert = require('assert');
const test = require('../mocha-index');

describe('`pageStatus` test-suite', () => {
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
    calls['getFrameworkInfo'] = undefined;
  });

  it('should load', async () => {
    await page.goto(url + '?page=status', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(calls['getFrameworkInfo'] === true);
    assert(location.search === '?page=status');
  });
});
