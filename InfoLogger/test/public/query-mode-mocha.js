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
const { injectLogs, waitForTextInElement } = require('../utils/utils');

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
    model.frameworkInfo = {
      isSuccess: () => true,
      payload: { mysql: { status: { ok: true } } },
      match: ({ Success }) => Success({ mysql: { status: { ok: true } } }),
    };
    model.log.filter.resetCriteria();
    model.log.empty();
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
    const queryPromise = model.log.query();
    await new Promise((resolve) => setTimeout(resolve, 50));
    model.log.cancelQuery();
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
    model.frameworkInfo = {
      isSuccess: () => true,
      payload: { mysql: { status: { ok: true } } },
      match: ({ Success }) => Success({ mysql: { status: { ok: true } } }),
    };

    // Default state of filters includes no text filters
    model.log.filter.resetCriteria();
    if (textFilterOperator) {
      model.log.filter.setCriteria(
        textFilterFieldByOperator[textFilterOperator],
        textFilterOperator,
        textFilterValueByOperator[textFilterOperator],
      );
    }
    await model.log.query();

    return { confirmCalls, postCalls };
  }, {
    confirmReturn,
    textFilterOperator,
    textFilterValueByOperator: TEXT_FILTER_VALUE_BY_OPERATOR,
    textFilterFieldByOperator: TEXT_FILTER_FIELD_BY_OPERATOR,
  });

/**
 * Waits until the log at the given index of `Log.list` is one of the rows currently rendered by the
 * virtual scrolling.
 * @param {Page} page - puppeteer page
 * @param {number} index - index in `Log.list`
 * @returns {Promise<void>} - resolves once the row is in the DOM
 */
const waitForRowsRendered = (page, index) =>
  page.waitForFunction((index) => {
    const rows = document.querySelectorAll('.table-logs-content tbody tr');
    const first = model.log.firstLogIndexInViewport;
    return rows.length > 0 && index >= first && index < first + rows.length;
  }, { timeout: 5000 }, index);

/**
 * Centre of the rendered row of the log at the given index of `Log.list`, in viewport coordinates.
 * @param {Page} page - puppeteer page
 * @param {number} index - index in `Log.list`, must be rendered (see `waitForRowsRendered`)
 * @returns {Promise<{x: number, y: number}>} - point to move the mouse to
 */
const rowBoxOfLogAtIndex = (page, index) =>
  page.evaluate((index) => {
    const rows = document.querySelectorAll('.table-logs-content tbody tr');
    const row = rows[index - model.log.firstLogIndexInViewport];
    const { x, y, width, height } = row.getBoundingClientRect();
    return { x: x + width / 2, y: y + height / 2 };
  }, index);

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

  describe('selection copy', () => {
    const rowCount = 100;

    before(async () => {
      await page.evaluate(() => {
        window.__copiedContextMenuValue = undefined;
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: (value) => {
              window.__copiedContextMenuValue = value;
            },
          },
          configurable: true,
        });
      });

      const logsToInject = Array.from({ length: rowCount }, (_, i) => ({
        severity: 'I',
        message: `info log ${i}`,
        timestamp: Date.now(),
      }));

      await injectLogs(
        page,
        logsToInject,
      );
    });

    beforeEach(async () => {
      // previous tests may have left the table scrolled down or an input focused, start from a known state
      await page.evaluate(() => {
        document.activeElement?.blur();
        model.log.selection.clear(); // remember clears the selection not the log list
        model.log.dom.table.scrollTo(0, 0);
      });

      await waitForRowsRendered(page, 0);
      await waitForTextInElement(page, '.table-logs-content tbody tr:first-child', 'info log 0', 5000);
    });

    it('should be in the correct initial state', async () => {
      const selection = await page.evaluate(() => {
        const { selection } = model.log;
        const { anchor, focus, from, to, items, isActive, isCollapsed } = selection;
        return { anchor, focus, from, to, items, isActive, isCollapsed };
      });

      assert.strictEqual(selection.anchor, null, 'selection.anchor should be null');
      assert.strictEqual(selection.focus, null, 'selection.focus should be null');
      assert.strictEqual(selection.from, null, 'selection.from should be null');
      assert.strictEqual(selection.to, null, 'selection.to should be null');
      assert.deepStrictEqual(selection.items, [], 'selection.items should be empty');
      assert.ok(!selection.isActive, 'selection should be inactive');
      assert.ok(selection.isCollapsed, 'selection should be collapsed');
    });

    it('should copy multiple rows in the correct format', async () => {
      // press on the first row and press down
      const firstRowBox = await rowBoxOfLogAtIndex(page, 0);
      await page.mouse.move(firstRowBox.x, firstRowBox.y);
      await page.mouse.down();

      // scroll the last log into view
      // as only ~30 rows are rendered at a time, this tests that the selection survives
      // the rows it started on being recycled by the virtual scrolling
      await page.evaluate(() => {
        const { log } = model;
        log.dom.table.scrollTo(0, log.rowHeight * log.list.length);
      });
      await waitForRowsRendered(page, rowCount - 1);

      const lastRowBox = await rowBoxOfLogAtIndex(page, rowCount - 1);
      await page.mouse.move(lastRowBox.x, lastRowBox.y, { steps: 10 });
      await page.mouse.up();

      // copy the selection to the clipboard
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyC');
      await page.keyboard.up('Control');

      const copied = await page.evaluate(() => window.__copiedContextMenuValue);
      assert.ok(copied, 'copied text should not be empty');
      const lines = copied.split('\n').filter((line) => line.trim() !== '');

      assert.strictEqual(lines.length, rowCount, `expected ${rowCount} lines copied, got ${lines.length}`);
      // each row should be in the csv format of the table
      for (let i = 0; i < rowCount; i++) {
        const { date, time } = await page.evaluate((i) => {
          const date = model.timezone.format(model.log.list[i].timestamp, 'date');
          const time = model.timezone.format(model.log.list[i].timestamp, model.log.timeFormat);
          return { date, time };
        }, i);
        const expected = `I, info log ${i}, ${time}, ${date}`;
        assert.ok(lines[i].startsWith(expected), `line ${i} should start with "${expected}", got "${lines[i]}"`);
      }
    });
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
