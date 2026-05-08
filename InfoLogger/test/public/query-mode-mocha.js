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

/**
 * Runs model.log.query() in the browser context with mocked dependencies.
 * @param {Page} page - puppeteer page
 * @param {object} options
 * @param {boolean} options.confirmReturn - value window.confirm will return
 * @param {boolean} [options.setTextFilter=false] - if true, sets a message match filter before querying
 * @returns {Promise<{confirmCalls: number, postCalls: number}>}
 */
const runQueryWithMocks = (page, { confirmReturn, setTextFilter = false }) =>
  // Sets up mocks for confirmation dialog and post request, needs to be run in the browser context
  page.evaluate(async ({ confirmReturn, setTextFilter }) => {
    let confirmCalls = 0;
    let postCalls = 0;

    window.confirm = () => {
      confirmCalls += 1;
      return confirmReturn;
    };

    window.model.loader.post = async () => {
      postCalls += 1;
      return { ok: true, result: { rows: [] } };
    };

    // Mock the frameworkInfo to make the query method think the query service is available in its check
    window.model.frameworkInfo = {
      isSuccess: () => true,
      payload: { mysql: { status: { ok: true } } },
    };

    // Default state of filters includes no text filters
    window.model.log.filter.resetCriteria();
    if (setTextFilter) {
      window.model.log.filter.setCriteria('message', 'match', 'some-message');
    }
    await window.model.log.query();

    return { confirmCalls, postCalls };
  }, { confirmReturn, setTextFilter });

describe('Query Mode test-suite', async () => {
  let page;

  before(async () => {
    page = test.page;
  });

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

  describe('no-text-filter confirmation dialog', () => {
    it('should ask for confirmation when no text filters are set and not execute query when user cancels', async () => {
      const result = await runQueryWithMocks(page, { confirmReturn: false });
      assert.strictEqual(result.confirmCalls, 1);
      assert.strictEqual(result.postCalls, 0);
    });

    it('should execute the query when no text filters are set but user confirms the dialog anyway', async () => {
      const result = await runQueryWithMocks(page, { confirmReturn: true });
      assert.strictEqual(result.confirmCalls, 1);
      assert.strictEqual(result.postCalls, 1);
    });

    it('should not ask for confirmation when at least one text filter is set', async () => {
      const result = await runQueryWithMocks(page, { confirmReturn: true, setTextFilter: true });
      assert.strictEqual(result.confirmCalls, 0);
      assert.strictEqual(result.postCalls, 1);
    });
  });
});
