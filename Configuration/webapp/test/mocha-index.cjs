/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

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
