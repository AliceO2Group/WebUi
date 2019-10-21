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

  it('should load', async () => {
    await page.goto(url + '?page=status', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=status');
  });

  it('should have gotten data from getFrameworkInfo', async () => {
    assert(calls['getFrameworkInfo'] === true);
  });
});
