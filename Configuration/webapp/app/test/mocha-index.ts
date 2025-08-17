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

import puppeteer, { Browser, Page } from 'puppeteer';
import config from './test-config';

let page: Page | null = null;

type Global = {
  test: {
    page: Page | null;
    browser: Browser | null;
    helpers: Record<string, string>;
  };
};

const global: Global = {
  test: {
    page: null,
    browser: null,
    helpers: {},
  },
};

export const mochaHooks = {
  async beforeAll() {
    let browser: Browser | null = null;
    const url = `http://${config.http.hostname}:${config.http.port}/`;
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    page = await browser.newPage();

    // Listen to browser
    page.on('error', (pageerror) => {
      console.error('        ', pageerror);
    });
    page.on('pageerror', (pageerror) => {
      console.error('        ', pageerror);
    });
    page.on('console', (msg) => {
      console.log(msg.args());
    });
    await page.setViewport({ width: 1200, height: 770 });

    global.test.page = page;
    global.test.browser = browser;
    global.test.helpers.url = url;
  },

  async afterAll() {
    const { test: { browser } } = global;
    if (browser === null) {
      return;
    }
    await browser.close();
  },
};

export default global;
