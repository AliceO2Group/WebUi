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

/* eslint-disable max-len */

const assert = require('assert');

const test = require('../mocha-index');

describe('Utils test-suite', async () => {
  let page;

  before(async () => {
    page = test.page;
  });

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

    await page.waitForTimeout(200);
    counter = await page.evaluate(() => {
      return window.testCounter;
    });
    assert.strictEqual(counter, 2);
  });
});
