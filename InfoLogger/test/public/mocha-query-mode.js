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

describe('Query Mode test-suite', async () => {
  let baseUrl;
  let page;

  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
    // TODO go back to new page
  });
  describe('Query mode', () => {
    it('should fail because it is not configured', async () => {
      try {
        await page.evaluate(async () => {
          return await window.model.log.query();
        });
        assert.fail();
      } catch (e) {
        // code failed, so it is a successful test
      }
    });
  });

});
