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
const test = require('../mocha-index');

const TEXT_FILTER_VALUE_BY_OPERATOR = {
  since: '2026-01-01T00:00:00.000Z',
  until: '2026-01-01T00:00:00.000Z',
  match: 'some-message',
  exclude: 'some-message',
  emptyFor: 'match',
};

const TEXT_FILTER_FIELD_BY_OPERATOR = {
  since: 'timestamp',
  until: 'timestamp',
  match: 'message',
  exclude: 'message',
  emptyFor: 'rolename',
};

/**
 * Runs model.log.query() in the browser context with mocked dependencies.
 * @param {Page} page - puppeteer page
 * @param {object} options
 * @param {boolean} options.confirmReturn - value window.confirm will return
 * @param {string} [options.textFilterOperator] - operator to set before querying
 * @returns {Promise<{confirmCalls: number, postCalls: number}>}
 */
/**
 * Sets up common browser-context state for cancel query tests:
 * confirms all dialogs, mocks frameworkInfo as healthy, and resets log/filter state.
 * @param {Page} page - puppeteer page
 * @returns {Promise<void>}
 */
const setupQueryTestState = (page) =>
  page.evaluate(() => {
    window.confirm = () => true;
    window.model.frameworkInfo = {
      isSuccess: () => true,
      payload: { mysql: { status: { ok: true } } },
      match: ({ Success }) => Success({ mysql: { status: { ok: true } } }),
    };
    window.model.log.filter.resetCriteria();
    window.model.log.empty();
  });

/**
 * Starts a never-resolving query in the browser context, then immediately cancels it.
 * Useful as a shared setup step for tests that need to assert state after a cancellation.
 * @param {Page} page - puppeteer page
 * @returns {Promise<void>}
 */
const startAndCancelQuery = (page) =>
  page.evaluate(async () => {
    window.fetch = (_url, { signal } = {}) => new Promise((_, reject) => {
      signal?.addEventListener('abort', () => reject(new DOMException('AbortError', 'AbortError')));
    });
    const queryPromise = window.model.log.query();
    await new Promise((resolve) => setTimeout(resolve, 50));
    window.model.log.cancelQuery();
    await queryPromise;
  });

const runQueryWithMocks = (page, { confirmReturn, textFilterOperator }) =>
  // Sets up mocks for confirmation dialog and post request, needs to be run in the browser context
  page.evaluate(async ({
    confirmReturn,
    textFilterOperator,
    textFilterValueByOperator,
    textFilterFieldByOperator,
  }) => {
    let confirmCalls = 0;
    let postCalls = 0;

    window.confirm = () => {
      confirmCalls += 1;
      return confirmReturn;
    };

    window.fetch = async () => {
      postCalls += 1;
      return { ok: true,
        status: 200,
        json: async () => [] };
    };

    // Mock the frameworkInfo to make the query method think the query service is available in its check
    window.model.frameworkInfo = {
      isSuccess: () => true,
      payload: { mysql: { status: { ok: true } } },
      match: ({ Success }) => Success({ mysql: { status: { ok: true } } }),
    };

    // Default state of filters includes no text filters
    window.model.log.filter.resetCriteria();
    if (textFilterOperator) {
      window.model.log.filter.setCriteria(
        textFilterFieldByOperator[textFilterOperator],
        textFilterOperator,
        textFilterValueByOperator[textFilterOperator],
      );
    }
    await window.model.log.query();

    return { confirmCalls, postCalls };
  }, {
    confirmReturn,
    textFilterOperator,
    textFilterValueByOperator: TEXT_FILTER_VALUE_BY_OPERATOR,
    textFilterFieldByOperator: TEXT_FILTER_FIELD_BY_OPERATOR,
  });

describe('Query Mode test-suite', async () => {
  let page;

  before(async () => {
    page = test.page;
  });

  it('should fail because it is not configured', async () => {
    try {
      await page.evaluate(async () => await window.model.log.query());
      assert.fail();
    } catch (e) {
      // code failed, so it is a successful test
    }
  });

  describe('no-text-filter confirmation dialog', () => {
    let textFilterOperators;

    before(async () => {
      ({
        TEXT_FILTER_OPERATORS: textFilterOperators,
      } = await import('../../public/constants/text-filter-operators.const.js'));
    });

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

    it('should not ask for confirmation for each active text filter operator', async () => {
      for (const operator of textFilterOperators) {
        const result = await runQueryWithMocks(page, { confirmReturn: true, textFilterOperator: operator });
        assert.strictEqual(result.confirmCalls, 0, `expected no confirm dialog for operator "${operator}"`);
        assert.strictEqual(result.postCalls, 1, `expected query execution for operator "${operator}"`);
      }
    });
  });

  describe('cancel query - AbortController', () => {
    beforeEach(async () => {
      await setupQueryTestState(page);
    });

    it('should display a Cancel button while a query is in flight and the Query button should be absent', async () => {
      const result = await page.evaluate(async () => {
        // Never-resolving fetch to keep query in loading state, respects abort signal to allow clean teardown
        window.fetch = (_url, { signal } = {}) => new Promise((_, reject) => {
          signal?.addEventListener('abort', () => reject(new DOMException('AbortError', 'AbortError')));
        });

        const queryPromise = window.model.log.query();

        await new Promise((r) => setTimeout(r, 50));

        const cancelButton = document.querySelector('button#cancel-query-button');
        const queryButton = document.querySelector('button#query-button');

        // Clean up via cancel so the abort signal rejects the fetch and queryPromise resolves
        window.model.log.cancelQuery();
        await queryPromise;

        return {
          cancelButtonPresent: cancelButton !== null && cancelButton.textContent.includes('Cancel'),
          queryButtonAbsent: queryButton === null,
        };
      });

      assert.ok(result.cancelButtonPresent, 'Cancel button should be visible while query is loading');
      assert.ok(result.queryButtonAbsent, 'Query button should not be visible while query is loading');
    });

    it('should not mutate list or stats when a query is cancelled via the AbortController', async () => {
      await page.evaluate(() => {
        const existingLogs = [
          { severity: 'E', message: 'existing error', timestamp: Date.now() },
          { severity: 'I', message: 'existing info', timestamp: Date.now() },
        ];
        existingLogs.forEach((log) => window.model.log.addLog(log));
      });

      await startAndCancelQuery(page);

      const result = await page.evaluate(() => ({
        listLength: window.model.log.list.length,
        stats: window.model.log.stats,
        abortControllerCleared: window.model.log.queryAbortController === null,
      }));

      assert.strictEqual(result.listLength, 2, 'list should still contain the pre-existing logs after cancellation');
      assert.strictEqual(result.stats.error, 1, 'error stat should reflect only the pre-existing error log');
      assert.strictEqual(result.stats.info, 1, 'info stat should reflect only the pre-existing info log');
      assert.ok(result.abortControllerCleared, 'queryAbortController should be null after cancellation');
    });

    it('should allow a new query to start successfully after a previous one was cancelled', async () => {
      await startAndCancelQuery(page);

      const result = await page.evaluate(async () => {
        // Second query — resolves successfully with one row
        const fakeRow = { severity: 'I', message: 'ok', timestamp: Date.now() };
        window.fetch = async () => ({
          ok: true,
          status: 200,
          json: async () => ({ rows: [fakeRow], count: 1 }),
        });
        await window.model.log.query();

        return {
          isLoading: window.model.log.queryResult.isLoading(),
          isSuccess: window.model.log.queryResult.isSuccess(),
          listLength: window.model.log.list.length,
        };
      });
      await new Promise((r) => setTimeout(r, 200)); // wait for state to update after query
      assert.ok(!result.isLoading, 'query should not be stuck in loading state after second query');
      assert.ok(result.isSuccess, 'second query should succeed');
      assert.strictEqual(result.listLength, 1, 'list should contain the row from the second query');
    });
  });
});
