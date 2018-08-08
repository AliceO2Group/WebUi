const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
const {spawn} = require('child_process');

// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

// Tips:
// Network and rendering can have delays this can leads to random failures
// if they are tested just after their initialization.

describe('QCG', function () {
  let browser;
  let page;
  let subprocess; // web-server runs into a subprocess
  let subprocessOutput = '';
  this.timeout(5000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

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

    // Listen to browser
    page.on('error', pageerror => {
      console.error('        ', pageerror);
    });
    page.on('pageerror', pageerror => {
      console.error('        ', pageerror);
    });
    page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`        ${msg.args()[i]}`);
      }
    });
  });

  it('should load first page "/"', async () => {
    // try many times until backend server is ready
    for (let i = 0; i < 10; i++) {
      try {
        await page.goto(url, {waitUntil: 'networkidle0'});
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

  it('should have redirected to default page "/?page=layoutList"', async () => {
    const location = await page.evaluate(() => window.location);
    assert(location.search === '?page=layoutList');
  });

  it('should have a layout with header, sidebar and section', async () => {
    const headerContent = await page.evaluate(() => document.querySelector('header').innerHTML);
    const sidebarContent = await page.evaluate(() => document.querySelector('nav').innerHTML);
    const sectionContent = await page.evaluate(() => document.querySelector('section').innerHTML);

    assert(headerContent.includes('Quality Control'));
    assert(sidebarContent.includes('Explore'));
  });

  describe('page layoutList', () => {
    before(async () => {
      await page.goto(url + '?page=layoutList', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=layoutList');
    });

    it('should have a table with rows', async () => {
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert(rowsCount > 1);
    });

    it('should have a table with one row after filtering', async () => {
      await page.type('header input', 'AliRoot');
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert(rowsCount === 1);
    });

    it('should have a link to show a layout', async () => {
      await page.evaluate(() => document.querySelector('section table tbody tr a').click());
      const location = await page.evaluate(() => window.location);
      assert.strictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea12&layoutName=AliRoot%20dashboard');
      // id 5aba4a059b755d517e76ea12 is set in QCModelDemo
    });
  });

  describe('page layoutShow', () => {
    before(async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});

      // id 5aba4a059b755d517e76ea12 is set in QCModelDemo
      await page.goto(url + '?page=layoutShow&layoutId=5aba4a059b755d517e76ea12', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert.deepStrictEqual(location.search, '?page=layoutShow&layoutId=5aba4a059b755d517e76ea12');
    });

    it('should have tabs in the header', async () => {
      const tabsCount = await page.evaluate(() => document.querySelectorAll('header .btn-tab').length);
      assert(tabsCount > 1);
    });

    it('should have one edit button in the header', async () => {
      const buttonCount = await page.evaluate(() => document.querySelectorAll('header > div > div:nth-child(3) > button').length);
      assert.deepStrictEqual(buttonCount, 1);
    });

    it('should have jsroot svg plots in the section', async () => {
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert(plotsCount > 1);
    });

    it('should have one edit button in the header to go in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > button', {timeout: 5000});
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > button').click());
    });

    it('should have 3 buttons in edit mode', async () => {
      await page.waitForSelector('header > div > div:nth-child(3) > button', {timeout: 5000});
      const count = await page.evaluate(() => document.querySelectorAll('header > div > div:nth-child(3) > button').length);
      assert.deepStrictEqual(count, 3);
    });

    it('should have a tree sidebar in edit mode', async () => {
      await page.waitForSelector('nav table tbody tr'); // loading., {timeout: 5000}..
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 4); // 4 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('nav input', 'HistoWithRandom');
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 1); // 1 object
    });

    it('should show normal sidebar after Cancel click', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > button:nth-child(3)').click());
      await page.waitForSelector('nav .menu-title', {timeout: 5000});
    });

    it('should have second tab to be empty (according to demo data)', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(2) button:nth-child(2)').click());
      await page.waitForSelector('section h1', {timeout: 5000});
      const plotsCount = await page.evaluate(() => document.querySelectorAll('section svg.jsroot').length);
      assert.deepStrictEqual(plotsCount, 0);
    });
  });

  describe('page objectTree', () => {
    before(async () => {
      // weird bug, if we don't go to external website just here, all next goto will wait forever
      await page.goto('http://google.com', {waitUntil: 'networkidle0'});

      await page.goto(url + '?page=objectTree', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=objectTree');
    });

    it('should have a tree as a table', async () => {
      await page.waitForSelector('section table tbody tr', {timeout: 5000});
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 4); // 4 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('header input', 'HistoWithRandom');
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 1); // 1 object
    });

    it('should have a button to activate online mode', async () => {
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > button:nth-child(1)').click());
      await page.waitForSelector('header > div > div:nth-child(3) > button.active', {timeout: 5000});
    });

    it('should have nothing to show in online mode with the previous search', async () => {
      const rowsCount = await page.evaluate(() => document.querySelectorAll('section table tbody tr').length);
      assert.deepStrictEqual(rowsCount, 0);
    });
  });

  after(async () => {
    await browser.close();
    console.log('---------------------------------------------');
    console.log('Output of server logs for the previous tests:');
    console.log(subprocessOutput);
    subprocess.kill();
  });
});
