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

/* eslint-disable no-invalid-this */
/* eslint-disable no-console */
/* eslint-disable max-len */
const puppeteer = require('puppeteer');
const assert = require('assert');
const config = require('./config-provider');

let page;
const url = config.url;
const facility = config.facility;
const timestamp = config.timestamp;

describe('InfoLogger - FLP CI Suite Tests ', function() {
  let browser;
  this.timeout(config.timeout);
  this.slow(3000);

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

  it('should have successfully redirected to default page "/?q={"severity":{"in":"I W E F"}}"', async () => {
    const location = await page.evaluate(() => window.location);
    assert.strictEqual(location.search, '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}', 'Could not load home page of ILG GUI');
  });

  it(`should successfully type criteria based on "facility" matching ${facility}`, async () => {
    const facilityCriteria = await page.evaluate((facility) => {
      window.model.log.filter.resetCriterias();
      window.model.log.filter.setCriteria('facility', 'match', facility);
      return window.model.log.filter.criterias.facility;
    }, facility);

    const expFacility = {$exclude: null, $match: facility, exclude: '', match: facility};
    assert.deepStrictEqual(facilityCriteria, expFacility, 'Criteria for "facility" could not be filled successfully in the GUI');
  });

  it(`should successfully set criteria based on "time" matching ${timestamp}`, async () => {
    const timestampCriteria = await page.evaluate((timestamp) => {
      window.model.log.filter.setCriteria('timestamp', 'since', timestamp);
      return window.model.log.filter.criterias.timestamp;
    }, timestamp);
    assert.deepStrictEqual(timestampCriteria.since, timestamp, 'Criteria for "timestamp" could not be filled successfully in the GUI');
  });

  it('should successfully click on Query button and retrieve results', async () => {
    await page.evaluate(() => document.querySelector('body > div:nth-child(2) > div > header > div > div:nth-child(2) > button').click());
    await page.waitForTimeout(config.queryTime);
    const result = await page.evaluate(() => window.model.log.queryResult);
    if (result.kind === 'Loading') {
      await page.waitForTimeout(config.queryTime);
    } 
    assert.strictEqual(result.kind, 'Success', `Query action failed due to ${result.payload}`);
  });

  it('should have successfully received filtered data', async () => {
    const result = await page.evaluate(() => window.model.log.queryResult);
    assert.ok(result.payload.rows.length > 0, 'Queried data is empty');

    const isDataFiltered = result.payload.rows.map((element) => element.facility).every((elFacilty) => elFacilty === facility);
    assert.ok(isDataFiltered, `Data contains other facilities than ${facility}`);
  });

  after(async () => {
    await browser.close();
  });
});
