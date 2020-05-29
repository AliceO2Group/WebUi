const assert = require('assert');
const test = require('../mocha-index');

describe('`pageAbout` test-suite', async () => {
  let url;
  let page;
  let calls;

  before(async () => {
    url = test.helpers.url;
    page = test.page;
    calls = test.helpers.calls;
  });

  beforeEach(() => {
    // reset grpc calls
    calls['getFrameworkInfo'] = undefined;
  });

  it('should load', async () => {
    await page.goto(url + '?page=about', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(calls['getFrameworkInfo'], true);
    assert.strictEqual(location.search, '?page=about');
  });

  it('should request info about Control GUI and store in frameworkInfo RemoteData', async () => {
    const frameworkInfo = await page.evaluate(() => window.model.frameworkInfo.control.payload);
    assert.ok(frameworkInfo !== undefined);
    assert.ok(frameworkInfo['control-gui'] !== undefined);
  });
});
