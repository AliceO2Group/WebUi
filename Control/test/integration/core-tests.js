/* eslint-disable no-invalid-this */
/* eslint-disable no-console */
/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const puppeteer = require('puppeteer');
const assert = require('assert');

let page;
describe('Control', function() {
  let browser;
  this.timeout(180000);
  this.slow(1000);
  const url = 'http://localhost:8080/';

  before(async () => {
    this.ok = true;

    // Start browser to test UI
    browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: true});
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
    exports.page = page;
    exports.url = url;
    exports.requestTimeout = 90; // seconds
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

  it('should have redirected to default page "/?page=environments"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?page=environments', 'Could not load home page of AliECS GUI');
  });

  describe('Check if lock is acquired', () => {
    it('should successfully request LOCK if it is not already taken', async () => {
      let lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      if (lockButton !== 'Lock is taken by Anonymous (id 0)') {
        await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
        await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
        await page.waitFor(1000);
      }
      lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      assert.strictEqual(lockButton, 'Lock is taken by Anonymous (id 0)', 'Lock might be taken by another user');
    });
  });

  require('./create-new-environment');
  require('./control-environment.js');

  describe('Release lock', () => {
    it('should successfully release LOCK if it is not already released', async () => {
      let lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
      if (lockButton !== 'Lock is free') {
        await page.waitForSelector('body > div:nth-child(2) > div > div > button', {timeout: 5000});
        await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').click());
        await page.waitFor(1000);
      }
      lockButton = await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > div > button').title);
    });
  });

  beforeEach(() => {
    this.ok = true;
  });

  afterEach(() => {
    if (!this.ok) {
      throw new Error('Something went wrong. Please use "systemctl status o2-cog for more information"');
    }
  });

  after(async () => {
    await browser.close();
  });
});
