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

const isContextMenuOpen = async (page) => {
  return await page.evaluate(() => window.model.log.contextMenu.isOpen);
};

const openContextMenu = async (page, field, value, x, y) => {
  await page.evaluate((field, value, x, y) => {
    window.model.log.showContextMenu(field, value, x, y);
  }, field, value, x, y);
  await page.waitForSelector('.cell-context-menu');
  assert.strictEqual(await isContextMenuOpen(page), true);
};

const waitForMatchExcludeButtons = async (page) => {
  // wait for function as menu sometimes will render previous labels then update
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 4
      && labels[0] === 'Match'
      && labels[1] === 'Exclude'
      && labels[2] === 'Clear filter'
      && labels[3] === 'Copy';
  });
};

const waitForFromToButtons = async (page) => {
  await page.waitForFunction(() => {
    const labels = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
      .map((label) => label.textContent.trim());
    return labels.length === 4
      && labels[0] === 'From'
      && labels[1] === 'To'
      && labels[2] === 'Clear filter'
      && labels[3] === 'Copy';
  });
};

describe('Filter actions test-suite', async () => {
  let baseUrl;
  let page;

  before(async () => {
    baseUrl = test.helpers.baseUrl;
    page = test.page;
  });

  it('should succesfully load a page with profile in the URI', async function() {
    await page.goto(baseUrl + "?profile=physicist", {waitUntil: 'networkidle0'});
    const location = await page.evaluate(() => window.location);
    const search = decodeURIComponent(location.search);

    // for now, check if redirected to default page
    assert.strictEqual(search, '?q={"severity":{"in":"I W E F"}}');
  });

  it('should update column headers based on profile when passed in the URI', async () => {
    const expectedColumns = {
      date: {size: 'cell-m', visible: false},
      time: {size: 'cell-m', visible: true},
      hostname: {size: 'cell-m', visible: true},
      rolename: {size: 'cell-m', visible: false},
      pid: {size: 'cell-s', visible: false},
      username: {size: 'cell-m', visible: false},
      system: {size: 'cell-s', visible: true},
      facility: {size: 'cell-m', visible: true},
      detector: {size: 'cell-s', visible: true},
      partition: {size: 'cell-m', visible: true},
      run: {size: 'cell-s', visible: true},
      errcode: {size: 'cell-s', visible: false},
      errline: {size: 'cell-s', visible: false},
      errsource: {size: 'cell-m', visible: false},
      message: {size: 'cell-xl', visible: true}
    };

    const columns = await page.evaluate(() => {
      return window.model.table.colsHeader;
    });

    assert.deepStrictEqual(columns, expectedColumns);
  });

  it('should update filters based on profile when passed in the URI', async () => {
    // for now check if the filters are reset once the profile is passed 
    const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';

    const searchParams = await page.evaluate(() => {
      const params = {profile: 'physicist'};
      window.model.parseLocation(params);
      return window.location.search;
    });

    await page.waitForFunction(`window.model.notification.state === 'shown'`);
    await page.waitForFunction(`window.model.notification.type === 'success'`);
    await page.waitForFunction(`window.model.notification.message === "The profile PHYSICIST was loaded successfully"`);

    assert.strictEqual(searchParams, expectedParams);
  });

  it('should reset filters and show warning message when profile and filters are passed', async () => {
    // wait until the previous notification is hidden
    await page.waitForFunction(`window.model.notification.state === 'hidden'`);
    const expectedParams = '?q={%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
    const searchParams = await page.evaluate(() => {
      const params = {profile: "physicist", q: '"severity":{"in":"I W E F"}}'};
      window.model.parseLocation(params);
      return window.location.search;
    });

    await page.waitForFunction(`window.model.notification.state === 'shown'`);
    await page.waitForFunction(`window.model.notification.type === 'warning'`);
    await page.waitForFunction(`window.model.notification.message === "URL can contain only filters or profile, not both"`);
    assert.strictEqual(searchParams, expectedParams);
  });

  it('should redirect to default filters and show JSON parse error on malformed q in URI', async () => {
    const expectedDefaultParams = '?q={"severity":{"in":"I W E F"}}';

    const locationAndNotification = await page.evaluate(() => {
      const params = { q: '{"severity":{"in":"W I E F"' };
      window.model.parseLocation(params);
      return {
        search: window.location.search,
        notification: window.model.notification,
      };
    });

    assert.strictEqual(decodeURI(locationAndNotification.search), expectedDefaultParams);
    assert.strictEqual(locationAndNotification.notification.type, 'danger');
    // CI/CD runs on Chromium so this assertion is based on Chromium's JSON engine's error message
    assert.strictEqual(
      locationAndNotification.notification.message,
      'Invalid URL filter format: Expected \',\' or \'}\' after property value in JSON at position 27 (line 1 column 28)');
  });

  it('should update URI with new encoded "match" criteria', async () => {
    /* eslint-disable max-len */
    const decodedParams = '?q={"hostname":{"match":"\\"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
    const expectedParams = '?q={%22hostname%22:{%22match%22:%22%5C%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
    const searchParams = await page.evaluate(() => {
      window.model.log.filter.setCriteria('hostname', 'match', '"%ald_qdip01%');
      window.model.updateRouteOnModelChange();
      return window.location.search;
    });

    assert.deepStrictEqual(searchParams, expectedParams);
    assert.deepStrictEqual(decodeURI(searchParams), decodedParams);
  });

  it('should update URI with new encoded "exclude" criteria', async () => {
    /* eslint-disable max-len */
    const decodedParams = '?q={"hostname":{"exclude":"\\"%ald_qdip01%"},"severity":{"in":"I W E F"}}';
    const expectedParams = '?q={%22hostname%22:{%22exclude%22:%22%5C%22%25ald_qdip01%25%22},%22severity%22:{%22in%22:%22I%20W%20E%20F%22}}';
    const searchParams = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('hostname', 'exclude', '"%ald_qdip01%');
      window.model.updateRouteOnModelChange();
      return window.location.search;
    });

    assert.deepStrictEqual(searchParams, expectedParams);
    assert.deepStrictEqual(decodeURI(searchParams), decodedParams);
  });

  it('should parse dates in format DD/MM/YY', async () => {
    // default Geneva time
    const $since = await page.evaluate(() => {
      window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04');
      return window.model.log.filter.criterias.timestamp.$since.toISOString();
    });

    assert.strictEqual($since, '2004-01-31T23:00:00.000Z');
  });

  it('should parse dates in format DD/MM/YYTHH:MM', async () => {
    // default Geneva time
    const $since = await page.evaluate(() => {
      window.model.log.filter.setCriteria('timestamp', 'since', '01/02/04T00:00');
      return window.model.log.filter.criterias.timestamp.$since.toISOString();
    });

    assert.strictEqual($since, '2004-01-31T23:00:00.000Z');
  });

  it('should parse numbers to integers', async () => {
    const level = await page.evaluate(() => {
      window.model.log.filter.setCriteria('level', 'max', 12);
      return window.model.log.filter.criterias.level;
    });

    assert.strictEqual(level.$max, 12);
    assert.strictEqual(level.max, 12);
  });

  it('should parse empty keyword to null', async () => {
    const $match = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', '');
      return window.model.log.filter.criterias.pid.$match;
    });

    assert.strictEqual($match, null);
  });

  it('should parse keyword', async () => {
    const $match = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'match', '1234');
      return window.model.log.filter.criterias.pid.$match;
    });

    assert.strictEqual($match, '1234');
  });

  it('should parse no keywords to null', async () => {
    const $in = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'in', '');
      return window.model.log.filter.criterias.pid.$in;
    });
    assert.strictEqual($in, null);
  });

  it('should parse keywords to array', async () => {
    const $in = await page.evaluate(() => {
      window.model.log.filter.setCriteria('pid', 'in', '123 456');
      return window.model.log.filter.criterias.pid.$in;
    });

    assert.strictEqual($in.length, 2);
    assert.deepStrictEqual($in, ['123', '456']);
  });

  it('should reset filters and set them again', async () => {
    const criterias = await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.filter.setCriteria('level', 'max', 21);
      return window.model.log.filter.criterias;
    });

    assert.strictEqual(criterias.pid.match, '');
    assert.strictEqual(criterias.pid.$match, null);
    assert.strictEqual(criterias.level.max, 21);
    assert.strictEqual(criterias.level.$max, 21);
    assert.strictEqual(criterias.timestamp.since, '');
    assert.strictEqual(criterias.timestamp.$since, null);
    assert.strictEqual(criterias.severity.in, 'I W E F');
    assert.deepStrictEqual(criterias.severity.$in, ['W', 'I', 'E', 'F']);
  });

  describe('Cell Context Menu', async () => {
    const exampleRow = {
      severity: 'I',
      level: 3,
      timestamp: Date.parse('2024-05-11T10:20:30.000Z') / 1000,
      hostname: 'ctx-host-01',
      rolename: 'ctx-role',
      pid: '2001',
      username: 'ctx-user',
      system: 'ctx-system',
      facility: 'ctx-facility',
      detector: 'ctx-detector',
      partition: 'ctx-partition',
      run: '12',
      errcode: '404',
      errline: '17',
      errsource: 'ctx-source',
      message: 'ctx-message-01',
    };

    beforeEach(async () => {
      await page.evaluate((exampleRow) => {
        window.model.log.filter.resetCriteria();
        window.model.log.hideContextMenu();
        window.__copiedContextMenuValue = undefined;
        window.model.log.list = [exampleRow];
        window.model.notify();
      }, exampleRow);

      // Wait until the table is updated with the new log entry
      await page.waitForFunction(() => {
        const cells = Array.from(document.querySelectorAll('td.cell'));
        return cells.some((cell) => cell.textContent.trim() === 'ctx-host-01')
          && cells.some((cell) => cell.textContent.trim() === 'ctx-message-01');
      });
    });

    it('should show context menu on right click', async () => {
      await page.evaluate(() => {
        const hostNameCell = Array.from(document.querySelectorAll('td.cell'))
          .find((cell) => cell.textContent.trim() === 'ctx-host-01');
        hostNameCell.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 140,
          button: 2,
        }));
      });

      // Wait for render and for model value
      await page.waitForSelector('.cell-context-menu');
      assert.strictEqual(await isContextMenuOpen(page), true);
    });

    it('should close context menu on Escape key', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

      await page.evaluate(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Escape',
          keyCode: 27,
          which: 27,
          bubbles: true,
          cancelable: true,
        }));
      });

      assert.strictEqual(await isContextMenuOpen(page), false);
    });

    it('should close context menu on Enter key', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

      const isOpenAfterEnter = await page.evaluate(() => {
        document.body.dispatchEvent(new KeyboardEvent('keydown', {
          key: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        }));

        return window.model.log.contextMenu.isOpen;
      });

      assert.strictEqual(isOpenAfterEnter, false);
    });

    it('should close context menu on outside click', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

      const isOpenAfterOutsideClick = await page.evaluate(() => {
        const overlay = document.querySelector('.cell-context-menu-overlay');
        overlay.click();
        return window.model.log.contextMenu.isOpen;
      });

      assert.strictEqual(isOpenAfterOutsideClick, false);
    });

    it('should show correct actions for non-timestamp fields', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 120, 140);
      await waitForMatchExcludeButtons(page);
    });

    it('should show correct actions for timestamp fields', async () => {
      await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
      await waitForFromToButtons(page);
    });

    it('should apply "match" action for regular fields', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await waitForMatchExcludeButtons(page);

      const criteria = await page.evaluate(() => {
        const matchButton = document.querySelectorAll('.cell-context-menu-item.f7')[0];
        matchButton.click();
        return {
          match: window.model.log.filter.criterias.hostname.match,
          $match: window.model.log.filter.criterias.hostname.$match,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.match, 'ctx-host-01');
      assert.strictEqual(criteria.$match, 'ctx-host-01');
      assert.strictEqual(criteria.isOpen, false);
    });

    it('should apply "exclude" action for regular fields', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await waitForMatchExcludeButtons(page);

      const criteria = await page.evaluate(() => {
        const excludeButton = document.querySelectorAll('.cell-context-menu-item.f7')[1];
        excludeButton.click();
        return {
          exclude: window.model.log.filter.criterias.hostname.exclude,
          $exclude: window.model.log.filter.criterias.hostname.$exclude,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.exclude, 'ctx-host-01');
      assert.strictEqual(criteria.$exclude, 'ctx-host-01');
      assert.strictEqual(criteria.isOpen, false);
    });

    it('should clear criteria for regular fields', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await waitForMatchExcludeButtons(page);

      const criteria = await page.evaluate(() => {
        window.model.log.filter.setCriteria('hostname', 'match', 'ctx-host-01');
        window.model.log.filter.setCriteria('hostname', 'exclude', 'ctx-host-01');
        const clearButton = document.querySelectorAll('.cell-context-menu-item.f7')[2];
        clearButton.click();
        return {
          match: window.model.log.filter.criterias.hostname.match,
          $match: window.model.log.filter.criterias.hostname.$match,
          exclude: window.model.log.filter.criterias.hostname.exclude,
          $exclude: window.model.log.filter.criterias.hostname.$exclude,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.match, '');
      assert.strictEqual(criteria.$match, null);
      assert.strictEqual(criteria.exclude, '');
      assert.strictEqual(criteria.$exclude, null);
      assert.strictEqual(criteria.isOpen, false);
    });

    it('should apply "from" action for timestamp fields', async () => {
      await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
      await waitForFromToButtons(page);

      const menuValue = await page.evaluate(() => window.model.log.contextMenu.value);

      const criteria = await page.evaluate(() => {
        const fromButton = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
          .find((label) => label.textContent.trim() === 'From')
          ?.closest('.cell-context-menu-item');
        const expectedIso = window.model.timezone.parse(window.model.log.contextMenu.value)?.toISOString();
        fromButton.click();

        return {
          since: window.model.log.filter.criterias.timestamp.since,
          $since: window.model.log.filter.criterias.timestamp.$since?.toISOString(),
          expectedIso,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.since, menuValue);
      assert.strictEqual(criteria.$since, criteria.expectedIso);
      assert.strictEqual(criteria.isOpen, false);
    });

    it('should apply "to" action for timestamp fields', async () => {
      await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
      await waitForFromToButtons(page);

      const menuValue = await page.evaluate(() => window.model.log.contextMenu.value);

      const criteria = await page.evaluate(() => {
        const toButton = Array.from(document.querySelectorAll('.cell-context-menu-item .ph2.w-100'))
          .find((label) => label.textContent.trim() === 'To')
          ?.closest('.cell-context-menu-item');
        const expectedIso = window.model.timezone.parse(window.model.log.contextMenu.value)?.toISOString();
        toButton.click();

        return {
          until: window.model.log.filter.criterias.timestamp.until,
          $until: window.model.log.filter.criterias.timestamp.$until?.toISOString(),
          expectedIso,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.until, menuValue);
      assert.strictEqual(criteria.$until, criteria.expectedIso);
      assert.strictEqual(criteria.isOpen, false);
    });

    it('should clear criteria for timestamp fields', async () => {
      await page.evaluate(() => {
        window.model.log.filter.setCriteria('timestamp', 'since', '17/05/2026 18:42:05.509');
        window.model.log.filter.setCriteria('timestamp', 'until', '17/05/2026 18:42:05.509');
      });
      await openContextMenu(page, 'timestamp', '17/05/2026 18:42:05.509', 100, 120);
      await waitForFromToButtons(page);

      const criteria = await page.evaluate(() => {
        const clearButton = document.querySelectorAll('.cell-context-menu-item.f7')[2];
        clearButton.click();

        return {
          since: window.model.log.filter.criterias.timestamp.since,
          $since: window.model.log.filter.criterias.timestamp.$since,
          until: window.model.log.filter.criterias.timestamp.until,
          $until: window.model.log.filter.criterias.timestamp.$until,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(criteria.since, '');
      assert.strictEqual(criteria.$since, null);

      assert.strictEqual(criteria.until, '');
      assert.strictEqual(criteria.$until, null);

      assert.strictEqual(criteria.isOpen, false);
    });

    it('should copy value to clipboard', async () => {
      // Mock the clipboard API
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: (value) => {
              window.__copiedContextMenuValue = value;
              return Promise.resolve();
            },
          },
          configurable: true,
        });
      });

      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await waitForMatchExcludeButtons(page);

      const copied = await page.evaluate(async () => {
        const copyButton = document.querySelectorAll('.cell-context-menu-item.f7')[3];
        copyButton.click();
        // Wait for the mocked clipboard writeText to be called
        await Promise.resolve();

        return {
          value: window.__copiedContextMenuValue,
          isOpen: window.model.log.contextMenu.isOpen,
        };
      });

      assert.strictEqual(copied.value, 'ctx-host-01');
      assert.strictEqual(copied.isOpen, false);
    });
  });
});
