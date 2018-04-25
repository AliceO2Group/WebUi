const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./test-config.js');
// APIs:
// https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md
// https://mochajs.org/

describe('QCG', function () {
  let browser;
  let page;
  this.timeout(5000);
  this.slow(1000);
  const url = 'http://' + config.http.hostname + ':' + config.http.port + '/';

  before(async () => {
    browser = await puppeteer.launch({
      headless: true
    });
    page = await browser.newPage();
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
      assert(location.search === '?page=layoutShow&layout=AliRoot%20dashboard');
    });
  });

  describe('page layoutShow', () => {
    before(async () => {
      await page.goto(url + '?page=layoutShow&layout=AliRoot%20dashboard', {waitUntil: 'networkidle0'});
      const location = await page.evaluate(() => window.location);
      assert(location.search === '?page=layoutShow&layout=AliRoot+dashboard');
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
      await page.evaluate(() => document.querySelector('header > div > div:nth-child(3) > button').click());
    });

    it('should have 3 buttons in edit mode', async () => {
      const count = await page.evaluate(() => document.querySelectorAll('header > div > div:nth-child(3) > button').length);
      assert.deepStrictEqual(count, 3);
    });

    it('should have a tree sidebar in edit mode', async () => {
      await page.waitForSelector('nav table tr'); // loading...
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tr').length);
      assert.deepStrictEqual(rowsCount, 4); // 4 agents
    });

    it('should have filtered results on input search filled', async () => {
      await page.type('nav input', 'HistoWithRandom');
      const rowsCount = await page.evaluate(() => document.querySelectorAll('nav table tr').length);
      assert.deepStrictEqual(rowsCount, 1); // 1 object
    });
  });

  after(async () => {
    await browser.close();
  });
});
