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

/**
 * Helper function to get the counts of each severity type from the status bar.
 * @param {Page} page - puppeteer page
 * @returns {Promise<{D: number, I: number, W: number, E: number, F: number}>} object with severity counts for each type
 */
async function getSeverityCounts(page) {
  return await page.evaluate(() => {
    const counts = {};
    const severityLabels = ['d', 'i', 'w', 'e', 'f'];
    severityLabels.forEach((label) => {
      const el = document.querySelector(`span.ph1.severity-${label}`);
      const count = Number(el.textContent.trim().split(' ')[0]);
      counts[label.toUpperCase()] = count;
    });
    return counts;
  });
}

/**
 * Helper function to inject logs into the model and trigger a re-render.
 * @param {Page} page - puppeteer page
 * @param {Array<{severity: string}>} logs - array of log objects to inject
 */
async function injectLogs(page, logs) {
  await page.evaluate((logs) => {
    window.model.log.list = logs;
    window.model.log.resetStats();
    window.model.log.list.forEach((log) => window.model.log.addStats(log));
    window.model.notify();
  }, logs);
}

/**
 * Helper to wait until an element's text includes the expected substring.
 * @param {Page} page - puppeteer page
 * @param {string} selector - CSS selector
 * @param {string} text - substring to wait for
 */
async function waitForTextInElement(page, selector, text) {
  await page.waitForFunction(
    (sel, txt) => {
      const el = document.querySelector(sel);
      return el && el.textContent.includes(txt);
    },
    { timeout: 2000 },
    selector,
    text,
  );
}

describe('Status Bar test-suite', async () => {
  const AUTOSCROLL_SELECTOR = '#status-bar-application-options label[title*="Scroll down"] input';
  const INSPECTOR_SELECTOR = '#status-bar-application-options label[title*="Show details"] input';
  const SQL_QUERY = 'SELECT * FROM `messages` WHERE `timestamp`>=? AND `severity` IN (?) '
    + 'ORDER BY `TIMESTAMP` LIMIT 100000';

  let page = null;

  before(async () => {
    ({ page } = test);
    await page.goto(test.helpers.baseUrl, { waitUntil: 'networkidle0' });
  });

  it('should be visible on the page', async () => {
    const statusBar = await page.$('#status-bar');
    assert.ok(statusBar, 'status bar not found');
  });

  describe('Service Status (statusLogs)', () => {
    it('should display "Loading services..." when frameworkInfo is Loading', async () => {
      await page.evaluate(() => {
        const RemoteData = window.model.frameworkInfo.constructor;
        window.model.frameworkInfo = RemoteData.loading();
        window.model.notify();
      });

      await waitForTextInElement(page, '#status-bar', 'Loading services...');
    });

    it('should display "Unable to load services" when frameworkInfo is Failure', async () => {
      await page.evaluate(() => {
        const RemoteData = window.model.frameworkInfo.constructor;
        window.model.frameworkInfo = RemoteData.failure('connection error');
        window.model.notify();
      });

      await waitForTextInElement(page, '#status-bar', 'Unable to load services');
    });

    it('should display live mode connection string when live mode is running', async () => {
      await page.evaluate(() => {
        const RemoteData = window.model.frameworkInfo.constructor;
        window.model.frameworkInfo = RemoteData.success({
          mysql: { host: 'test-host.cern.ch', status: { ok: true } },
          infoLoggerServer: { status: { ok: true } },
        });
        window.model.log.activeMode = 'Running';
        window.model.log.liveStartedAt = new Date();
        window.model.notify();
      });

      await waitForTextInElement(page, '#status-bar', 'Connected to test-host.cern.ch');
    });

    after(async () => {
      await page.evaluate(() => {
        const RemoteData = window.model.frameworkInfo.constructor;
        window.model.frameworkInfo = RemoteData.success({
          mysql: { host: 'localhost', status: { ok: true } },
          infoLoggerServer: { status: { ok: true } },
        });
        window.model.log.activeMode = 'Query';
        window.model.log.liveStartedAt = null;
        clearInterval(window.model.log.liveInterval);
        window.model.notify();
      });
    });
  });

  describe('Buffer Status Dot Indicator', () => {
    describe('Limit Reached', () => {
      it('should set limitReached to null when decreasing limit', async () => {
        await injectLogs(page, [
          { severity: 'I' },
          { severity: 'I' },
          { severity: 'I' },
          { severity: 'I' },
          { severity: 'I' },
        ]);

        await page.evaluate(() => {
          // set limitReached so we can verify it gets reset to null
          window.model.log.limitReached = true;
          window.model.log.setLimit(5);
        });

        const limitReached = await page.evaluate(() => window.model.log.limitReached);
        assert.strictEqual(limitReached, null);
      });

      it('should set limitReached to null when increasing limit', async () => {
        await page.evaluate(() => {
          window.model.log.limitReached = true;
          window.model.log.setLimit(100000);
        });

        const limitReached = await page.evaluate(() => window.model.log.limitReached);
        assert.strictEqual(limitReached, null);
      });

      it('should reset limitReached to null when empty() is called', async () => {
        await page.evaluate(() => {
          window.model.log.limitReached = true;
          window.model.log.empty();
        });

        const limitReached = await page.evaluate(() => window.model.log.limitReached);
        assert.strictEqual(limitReached, null);
      });
    });

    describe('Dot Color and Tooltip', () => {
      it('should show grey dot and title when limitReached is null', async () => {
        await page.evaluate(() => {
          window.model.log.limitReached = null;
          window.model.notify();
        });

        await page.waitForFunction(
          () => document.querySelector('#status-bar-buffer-dot').style.color === 'rgb(108, 117, 125)',
          { timeout: 2000 },
        );

        const dotTitle = await page.$eval('#status-bar-buffer-dot', (el) => el.title);
        assert.strictEqual(dotTitle, 'No query data loaded');
      });

      it('should show green dot and title when limitReached is false', async () => {
        await page.evaluate(() => {
          window.model.log.limitReached = false;
          window.model.notify();
        });

        await page.waitForFunction(
          () => document.querySelector('#status-bar-buffer-dot').style.color === 'rgb(92, 184, 92)',
          { timeout: 2000 },
        );
        const dotTitle = await page.$eval('#status-bar-buffer-dot', (el) => el.title);
        assert.strictEqual(dotTitle, 'Limit OK');
      });

      it('should show red dot and title when limitReached is true', async () => {
        await page.evaluate(() => {
          window.model.log.limitReached = true;
          window.model.notify();
        });

        await page.waitForFunction(
          () => document.querySelector('#status-bar-buffer-dot').style.color === 'rgb(217, 83, 79)',
          { timeout: 2000 },
        );
        const dotTitle = await page.$eval('#status-bar-buffer-dot', (el) => el.title);
        assert.strictEqual(dotTitle, 'Limit reached - results may be incomplete');
      });
    });
  });

  describe('Buffer Size & Severity Counters', () => {
    before(async () => {
      await page.evaluate(() => {
        window.model.log.list = [];
        window.model.log.limit = 100000;
        window.model.log.limitReached = null;
        window.model.log.resetStats();
        window.model.notify();
      });
    });

    it('should display correct initial message/buffer text', async () => {
      await waitForTextInElement(page, '#status-bar-buffer-size', '0 / 100,000 (Buffer size)');
    });

    it('should display all severity counts as zero initially', async () => {
      assert.deepStrictEqual(
        await getSeverityCounts(page),
        { D: 0, I: 0, W: 0, E: 0, F: 0 },
      );
    });

    it('should update message/buffer text after injecting logs', async () => {
      await injectLogs(page, [
        { severity: 'I' },
        { severity: 'E' },
        { severity: 'E' },
        { severity: 'F' },
      ]);

      await waitForTextInElement(page, '#status-bar-buffer-size', '4 / 100,000 (Buffer size)');
    });

    it('should update severity counts to match injected logs', async () => {
      assert.deepStrictEqual(
        await getSeverityCounts(page),
        { D: 0, I: 1, W: 0, E: 2, F: 1 },
      );
    });

    it('should display query time after a successful query', async () => {
      await page.evaluate((query) => {
        const RemoteData = window.model.log.queryResult.constructor;
        window.model.log.queryResult = RemoteData.success({
          rows: [], time: 2345, count: 0, queryAsString: query,
        });
        window.model.notify();
      }, SQL_QUERY);

      await waitForTextInElement(page, '#status-bar', 'in 2.35s');
    });
  });

  describe('SQL Query Display', () => {
    it('should display the SQL query after a query is executed', async () => {
      await page.evaluate((query) => {
        const RemoteData = window.model.log.queryResult.constructor;
        window.model.log.queryResult = RemoteData.success({
          rows: [], time: 0, count: 0, queryAsString: query,
        });
        window.model.notify();
      }, SQL_QUERY);

      await page.waitForSelector('.query-item', { timeout: 2000 });
      const displayedQuery = await page.$eval('.query-item', (el) => el.textContent);
      assert.strictEqual(displayedQuery, SQL_QUERY);
    });

    it('should expand the SQL query when clicked', async () => {
      await page.$eval('.query-item', (el) => el.click());

      await page.waitForSelector('#status-bar-sql-query-menu', { timeout: 2000 });

      const expandedText = await page.$eval('#status-bar-sql-query-menu', (el) => el.textContent);
      assert.strictEqual(expandedText, `SQL QUERY${SQL_QUERY}`);
    });

    it('should display "Querying server..." when query is loading', async () => {
      await page.evaluate(() => {
        const RemoteData = window.model.log.queryResult.constructor;
        window.model.log.queryResult = RemoteData.loading();
        window.model.notify();
      });

      await waitForTextInElement(page, '#status-bar', 'Querying server...');

      await page.evaluate(() => {
        const RemoteData = window.model.log.queryResult.constructor;
        window.model.log.queryResult = RemoteData.notAsked();
        window.model.notify();
      });
    });
  });

  describe('ApplicationLimit Message', () => {
    it('should not show application message when list is under applicationLimit', async () => {
      await page.evaluate(() => {
        window.model.log.list = [];
        window.model.notify();
      });

      const message = await page.$('#status-bar-application-message');
      assert.strictEqual(message, null);
    });

    it('should show application message when list exceeds applicationLimit', async () => {
      await page.evaluate(() => {
        window.model.log.applicationLimit = 5;
        window.model.log.list = Array.from({ length: 6 }, () => ({ severity: 'I' }));
        window.model.notify();
      });

      await page.waitForSelector('#status-bar-application-message', { timeout: 2000 });
      const message = await page.$eval('#status-bar-application-message', (el) => el.textContent);
      assert.ok(message.includes('Application reached more than 5 logs, please clear if possible'));

      await page.evaluate(() => {
        window.model.log.list = [];
        window.model.log.applicationLimit = 500000;
        window.model.log.resetStats();
        window.model.notify();
      });
    });
  });

  describe('Application Options', () => {
    it('should toggle autoscroll when its checkbox is clicked', async () => {
      await page.click(AUTOSCROLL_SELECTOR);

      const checkedAfter = await page.$eval(AUTOSCROLL_SELECTOR, (el) => el.checked);
      const autoScrollModelValue = await page.evaluate(() => window.model.log.autoScrollLive);

      assert.strictEqual(autoScrollModelValue, checkedAfter);
      assert.strictEqual(checkedAfter, true);
    });

    it('should toggle inspector when its checkbox is clicked', async () => {
      await page.click(INSPECTOR_SELECTOR);

      const checkedAfter = await page.$eval(INSPECTOR_SELECTOR, (el) => el.checked);
      const inspectorModelValue = await page.evaluate(() => window.model.inspectorEnabled);

      assert.strictEqual(inspectorModelValue, checkedAfter);
      assert.strictEqual(checkedAfter, true);
    });
  });
});
