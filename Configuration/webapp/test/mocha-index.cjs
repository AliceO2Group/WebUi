const puppeteer = require('puppeteer');
const config = require('./test-config.cjs');

let page;

global.test = {
  page: null,
  helpers: {},
};

describe('Configuration', function () {
  let browser;
  this.timeout(50000);
  this.slow(1000);
  const url = `http://${config.http.hostname}:${config.http.port}/`;

  before(async function () {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    page = await browser.newPage();

    // Listen to browser
    page.on('error', (pageerror) => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('pageerror', (pageerror) => {
      console.error('        ', pageerror);
      this.ok = false;
    });
    page.on('console', (msg) => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`        ${msg.args()[i]}`);
      }
    });
    await page.setViewport({ width: 1200, height: 770 });

    global.test.page = page;
    global.test.helpers.url = url;
  });

  require('./public/page-root-mocha.cjs');

  beforeEach(function () {
    return (this.ok = true);
  });

  afterEach(function () {
    if (!this.ok) {
      throw new Error('something went wrong');
    }
  });

  after(async function () {
    await browser.close();
  });
});
