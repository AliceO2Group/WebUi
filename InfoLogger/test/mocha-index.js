const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');
const path = require('path');

const PROTO_PATH = path.join(__dirname, '../protobuf/octlserver.proto');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('InfoLogger', function () {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(5000);
  this.slow(1000);
  const baseUrl = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  const calls = {}; // Object.<string:method, bool:flag> memorize that gRPC methods have been called indeed

  before(async () => {
    // Start web-server in background
    subprocess = spawn('node', ['index.js', 'test/test-config.js'], {stdio: 'pipe'});
    subprocess.stdout.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });
    subprocess.stderr.on('data', (chunk) => {
      subprocessOutput += chunk.toString();
    });

    // Start browser to test UI
    browser = await puppeteer.launch({
      headless: true
    });
    page = await browser.newPage();
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(baseUrl, {waitUntil: 'networkidle0'});
        break; // conneciton ok, this test passed
      } catch(e) {
        if (e.message.includes('net::ERR_CONNECTION_REFUSED')) {
          await new Promise((done) => setTimeout(done, 500));
          continue; // try again
        }
        throw e;
      }
    }
  });

  it('should have redirected to default page "/?q={"level":{"max":1}}"', async function() {
    await page.goto(baseUrl, {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);
    assert.strictEqual(search, '?q={"level":{"max":1}}');
  });

  describe('LogFilter', async () => {
    it('parses dates', async () => {
      // default Geneva time
      const $since = await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04');
        return model.log.filter.criterias.timestamp.$since.toISOString();
      });
      assert.strictEqual($since, '2004-01-31T23:00:00.000Z');
    });

    it('parses numbers to integers', async () => {
      const $max = await page.evaluate(() => {
        window.model.log.filter.setCriteria('level', 'max', '12');
        return model.log.filter.criterias.level.$max;
      });
      assert.strictEqual($max, 12);
    });

    it('parses empty keyword to null', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '');
        return model.log.filter.criterias.pid.$match;
      });
      assert.strictEqual($match, null);
    });

    it('parses keywords to array', async () => {
      const $match = await page.evaluate(() => {
        window.model.log.filter.setCriteria('pid', 'match', '123 456');
        return model.log.filter.criterias.pid.$match;
      });
      assert.strictEqual($match.length, 2);
      assert.strictEqual($match[0], '123');
      assert.strictEqual($match[1], '456');
    });
  });

  describe('utils.js', async () => {
    it('can be injected', async () => {
      const watchDogInjection = page.waitForFunction('window.utils');
      await page.evaluate(() => {
        const script = document.createElement('script');
        script.type = 'module';
        const content = document.createTextNode('import * as utils from "/common/utils.js"; window.utils = utils;');
        script.appendChild(content);
        document.getElementsByTagName('head')[0].appendChild(script);
      });
      await watchDogInjection;
    });

    it('has a callRateLimiter to limit function calls per window', async () => {
      let counter = await page.evaluate(() => {
        window.testCounter = 0;
        window.testFunction = window.utils.callRateLimiter(() => window.testCounter++, 100);
        window.testFunction();
        window.testFunction();
        window.testFunction(); // 3 calls but counter will increase by 2 only at the end
        return window.testCounter;
      });
      assert.strictEqual(counter, 1);

      await page.waitFor(200);
      counter = await page.evaluate(() => {
        return window.testCounter;
      });
      assert.strictEqual(counter, 2);
    })
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log('---------------------------------------------');
    console.log(subprocessOutput);
    console.log('---------------------------------------------');
    subprocess.kill();
  });
});

