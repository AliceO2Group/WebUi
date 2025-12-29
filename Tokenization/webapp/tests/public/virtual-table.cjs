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

const assert = require('assert');
const { waitForBackend } = require('../helper.cjs');

describe('Virtual Table Functionality', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  it('Check if tokens table is virtualized', async function() {
    await page.goto(`${url}/tokens/active`);
    await page.waitForSelector('table tbody tr');
    await waitForBackend();

    const initialRows = await page.$$eval('table tbody tr', rows => rows.length);
    assert.ok(initialRows < 20, `Expected less than 20 rows to be rendered initially, but found ${initialRows}`);
  });
});
