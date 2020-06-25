/* eslint-disable no-invalid-this */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./config-provider');

let page;
const url = config.url;
const timeout = config.timeout;
describe('QCG', function() {
  let browser;
  this.timeout(timeout);
  this.slow(1000);

  before(async () => {
    // Start browser to test UI
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true});
    page = await browser.newPage();
    exports.page = page;
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
        break; // connection ok, this test passed
      } catch (e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?page=objectTree"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=objectTree', 'Could not load home page of QCG');
  });

  require('./offline-mode.js');
  require('./online-mode.js');

  after(async () => {
    await browser.close();
  });
});
