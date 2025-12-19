
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
    readAlertMessage,
} = require('../helper.cjs');

const { tryRevokeSingleToken,
    tryBulkRevokeTokens
 } = require('./tokens/helpers.cjs');

describe('Auth Error Alert when no-auth access to auth operations', function() {
  let url;
  let page;

  before(async function() {
    ({ page, helpers: { url } } = test);
  });

  describe('Token Page', function() {
    it('Displays auth error when trying to revoke token without auth', async function() {
        const tokenId = '1';
        await page.goto(`${url}/tokens/active`);
        await page.waitForSelector('table tbody tr');
        await tryRevokeSingleToken(page,tokenId);
        const alertText = await readAlertMessage(page);
        assert.ok(alertText.includes('Authorization error'), 'Auth error alert not displayed when revoking token without auth');
    })

    it('Displays auth error when trying to bulk revoke tokens without auth', async function() {
        await page.goto(`${url}/tokens/active`);
        await tryBulkRevokeTokens(page, '2023-12-19T14:30');
        const alertText = await readAlertMessage(page);
        assert.ok(alertText.includes('Authorization error'), 'Auth error alert not displayed when bulk revoking tokens without auth');
    })
  })
});