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
const {
  waitForFrontend,
} = require('../../helper.cjs');

const { tryRevokeSingleToken } = require('./helpers.cjs');

describe('Token Revocation', function() {
  let url;
  let page;

  before(async function() {
    ({ helpers: { url: url }, page: page } = test);
  });

  beforeEach(async function() {
    await page.goto(`${url}/tokens/active?access=admin`);
  });

  it('Revocating single token changes its status to not-active', async function() {
    const tokenId = '1';
    await tryRevokeSingleToken(page, tokenId);
    await page.goto(`${url}/tokens/${tokenId}?access=admin`);
    await waitForFrontend();

    await page.waitForSelector('.MuiChip-root .MuiChip-label');

    const chips = await page.$$eval('.MuiChip-root .MuiChip-label', (labels) =>
      labels.map((label) => label.textContent.trim().toLowerCase()),
    );

    assert.ok(chips.includes('not active'), 'Token status did not change to not-active after revocation');
  });

});
