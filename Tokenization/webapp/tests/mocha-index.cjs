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
const config = require('./config.cjs');

let browser;
let page;
let url;

global.test = {
  page: null,
  helpers: {},
};

describe('Tokenization', function() {

  before(async function() {
    this.timeout(50000);
    this.slow(1000);
    url = `http://${config.http.hostname}:${config.http.port}`;

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox'],
    });

    page = await browser.newPage();

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
    await page.setViewport({ width: 1600, height: 900 });

    global.test.page = page;
    global.test.helpers.url = url;
  });

  require('./public/basic.cjs');
  require('./public/auth-error-alert.cjs');
  require('./public/virtual-table.cjs');
  require('./public/tokens/revocation.cjs');

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
