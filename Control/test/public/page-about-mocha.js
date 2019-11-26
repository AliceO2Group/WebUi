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
    // weird bug, if we don't go to external website just here, all next goto will wait forever
    await page.goto('http://google.com', {waitUntil: 'networkidle0'});
  });

  beforeEach(() => {
    // reset grpc calls
    calls['GetFrameworkInfo'] = undefined;
  });

  it('should load', async () => {
    await page.goto(url + '?page=about', {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(calls['GetFrameworkInfo'], true);
    assert.strictEqual(location.search, '?page=about');
  });

  it('should request info about Control GUI and store in frameworkInfo RemoteData', async () => {
    const frameworkInfo = await page.evaluate(() => window.model.frameworkInfo.control.payload);
    assert(frameworkInfo !== undefined);
    assert(frameworkInfo['control-gui'] !== undefined);
  });
});
