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
/* eslint-disable @stylistic/js/max-len */

const assert = require('assert');
const test = require('../mocha-index');
const {
  isContextMenuOpen,
  getMenuActionLabels,
  openContextMenu,
  isMenuItemDisabled,
  clickMenuItemByLabel,
} = require('./context-menu-test-utils');

describe('Cell Context Menu', async () => {
  const filledRow = {
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

  const emptyRow = {
    severity: 'W',
    level: 1,
    timestamp: Date.parse('2024-05-11T11:00:00.000Z') / 1000,
    hostname: '',
    rolename: '',
    pid: '',
    username: '',
    system: '',
    facility: '',
    detector: '',
    partition: '',
    run: '',
    errcode: '',
    errline: '',
    errsource: '',
    message: '',
  };

  let baseUrl = null;
  let page = null;

  before(async () => {
    ({ baseUrl } = test.helpers);
    ({ page } = test);

    await page.goto(`${baseUrl}?profile=physicist`, { waitUntil: 'networkidle0' });

    await page.evaluate((filledRow, emptyRow) => {
      window.confirm = () => false;
      window.model.log.list = [filledRow, emptyRow];
      window.model.notify();
    }, filledRow, emptyRow);

    await page.waitForFunction(() => {
      const cells = Array.from(document.querySelectorAll('.cell-text'));
      return cells.some((cell) => cell.textContent.trim() === 'ctx-host-01')
            && cells.some((cell) => cell.textContent.trim() === 'ctx-message-01');
    });
  });

  beforeEach(async () => {
    await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.contextMenu.hide();
    });
  });

  describe('Menu visibility', async () => {
    it('should show context menu on right-click', async () => {
      await page.evaluate(() => {
        const hostNameCell = Array.from(document.querySelectorAll('.cell-text'))
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

    it('should close context menu on "Escape" key', async () => {
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

    it('should close context menu on "Enter" key', async () => {
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

    it('should close context menu on overlay click', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

      const isOpenAfterOutsideClick = await page.evaluate(() => {
        const overlay = document.querySelector('.cell-context-menu-overlay');
        overlay.click();
        return window.model.log.contextMenu.isOpen;
      });

      assert.strictEqual(isOpenAfterOutsideClick, false);
    });

    it('should select the row on right-click', async () => {
      await page.evaluate(() => {
        window.model.log.setItem(null);
        window.model.notify();
      });

      // Dispatch actual right-click event on the cell to trigger the context menu and row selection
      await page.evaluate(() => {
        const cell = Array.from(document.querySelectorAll('.cell-text'))
          .find((cell) => cell.textContent.trim() === 'ctx-message-01');
        cell.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
          clientX: 100,
          clientY: 120,
          button: 2,
        }));
      });

      await page.waitForSelector('.cell-context-menu');
      const selectedMessage = await page.evaluate(() => window.model.log.item?.message);
      assert.strictEqual(selectedMessage, 'ctx-message-01');
    });

    it('should not open context menu on right-click of empty cell', async () => {
      await page.evaluate(() => {
        const emptyCell = Array.from(document.querySelectorAll('td.cell'))
          .find((cell) => {
            const textEl = cell.querySelector('.cell-text');
            return textEl && textEl.textContent.trim() === '';
          });
        emptyCell.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, clientX: 100, clientY: 120, button: 2,
        }));
      });

      assert.strictEqual(await isContextMenuOpen(page), false);
    });
  });

  describe('Menu header', async () => {
    it('should display the capitalized field name for regular fields', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await page.waitForSelector('.cell-context-menu-header');

      const header = await page.evaluate(() => {
        const headerEl = document.querySelector('.cell-context-menu-header');
        const spans = headerEl.querySelectorAll('span');
        return {
          fieldName: spans[0]?.textContent.trim(),
          value: spans[1]?.textContent.trim(),
        };
      });

      assert.strictEqual(header.fieldName, 'Hostname');
      assert.strictEqual(header.value, 'ctx-host-01');
    });

    it('should display "Timestamp" for timestamp fields', async () => {
      await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
      await page.waitForSelector('.cell-context-menu-header');

      const fieldName = await page.evaluate(() => {
        const headerEl = document.querySelector('.cell-context-menu-header');
        return headerEl.querySelector('span')?.textContent.trim();
      });

      assert.strictEqual(fieldName, 'Timestamp');
    });

    it('should display the cell value in the header', async () => {
      await openContextMenu(page, 'message', 'ctx-message-01', 100, 120);
      await page.waitForSelector('.cell-context-menu-header');

      const value = await page.evaluate(() => {
        const headerEl = document.querySelector('.cell-context-menu-header');
        const spans = headerEl.querySelectorAll('span');
        return spans[1]?.textContent.trim();
      });

      assert.strictEqual(value, 'ctx-message-01');
    });

    it('should have a title attribute on the value span for tooltip', async () => {
      await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
      await page.waitForSelector('.cell-context-menu-header');

      const title = await page.evaluate(() => {
        const headerEl = document.querySelector('.cell-context-menu-header');
        const [, valueSpan] = headerEl.querySelectorAll('span');
        return valueSpan?.getAttribute('title');
      });

      assert.strictEqual(title, 'ctx-host-01');
    });
  });

  describe('Menu actions', async () => {
    describe('Menu actions visibility', async () => {
      it('should show correct actions for Match/Exclude fields', async () => {
        await openContextMenu(page, 'hostname', 'ctx-host-01', 120, 140);
        const labels = await getMenuActionLabels(page);
        assert.deepStrictEqual(labels, ['Match', 'Exclude', 'Clear Filter', 'Copy', 'Open Inspector']);
      });

      it('should show correct actions for From/To fields', async () => {
        await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
        const labels = await getMenuActionLabels(page);
        assert.deepStrictEqual(labels, ['From', 'To', 'Clear Filter', 'Copy', 'Open Inspector']);
      });

      it('should show correct actions for severity field', async () => {
        await openContextMenu(page, 'severity', 'I', 100, 120);
        const labels = await getMenuActionLabels(page);
        assert.deepStrictEqual(labels, ['Show Severity', 'Hide Severity', 'Reset Severity Filter', 'Copy', 'Open Inspector']);
      });

      it('should show correct actions for level field', async () => {
        await openContextMenu(page, 'level', '3', 100, 120);
        const labels = await getMenuActionLabels(page);
        assert.deepStrictEqual(labels, ['Set Level To Support', 'Set Level To Ops', 'Reset Level Filter', 'Copy', 'Open Inspector']);
      });
    });

    describe('Menu actions functionality', async () => {
      describe('Match/Exclude/Clear', async () => {
        it('should apply "match" action for regular fields', async () => {
          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Match');

          const criteria = await page.evaluate(() => ({
            match: window.model.log.filter.criterias.hostname.match,
            $match: window.model.log.filter.criterias.hostname.$match,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.match, 'ctx-host-01');
          assert.strictEqual(criteria.$match, 'ctx-host-01');
          assert.strictEqual(criteria.isOpen, false);
        });

        it('should apply "exclude" action for regular fields', async () => {
          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Exclude');

          const criteria = await page.evaluate(() => ({
            exclude: window.model.log.filter.criterias.hostname.exclude,
            $exclude: window.model.log.filter.criterias.hostname.$exclude,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.exclude, 'ctx-host-01');
          assert.strictEqual(criteria.$exclude, 'ctx-host-01');
          assert.strictEqual(criteria.isOpen, false);
        });

        it('should clear criteria for regular fields', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'match', 'ctx-host-01');
            window.model.log.filter.setCriteria('hostname', 'exclude', 'ctx-host-01');
            window.model.log.filter.setCriteria('hostname', 'emptyFor', 'match');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Clear Filter');

          const criteria = await page.evaluate(() => ({
            match: window.model.log.filter.criterias.hostname.match,
            $match: window.model.log.filter.criterias.hostname.$match,
            exclude: window.model.log.filter.criterias.hostname.exclude,
            $exclude: window.model.log.filter.criterias.hostname.$exclude,
            emptyFor: window.model.log.filter.criterias.hostname.emptyFor,
            $emptyFor: window.model.log.filter.criterias.hostname.$emptyFor,

            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.match, '');
          assert.strictEqual(criteria.$match, null);
          assert.strictEqual(criteria.exclude, '');
          assert.strictEqual(criteria.$exclude, null);
          assert.strictEqual(criteria.emptyFor, null);
          assert.strictEqual(criteria.$emptyFor, null);
          assert.strictEqual(criteria.isOpen, false);
        });

        it('should append to existing match filter instead of replacing', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('system', 'match', 'existing-system');
          });

          await openContextMenu(page, 'system', 'ctx-system-01', 100, 120);
          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('ctx-system-01');
          });

          await clickMenuItemByLabel(page, 'Match');

          const match = await page.evaluate(() => window.model.log.filter.criterias.system.match);
          assert.strictEqual(match, 'existing-system ctx-system-01');
        });

        it('should append to existing exclude filter instead of replacing', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'exclude', 'existing-host');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('ctx-host-01');
          });

          await clickMenuItemByLabel(page, 'Exclude');

          const exclude = await page.evaluate(() => window.model.log.filter.criterias.hostname.exclude);
          assert.strictEqual(exclude, 'existing-host ctx-host-01');
        });

        it('should not duplicate value when appending to filter', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'match', 'ctx-host-01');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Match');

          const match = await page.evaluate(() => window.model.log.filter.criterias.hostname.match);
          assert.strictEqual(match, 'ctx-host-01');
        });

        it('should use newline separator when appending to message filter', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('message', 'match', 'first message');
          });

          await openContextMenu(page, 'message', 'ctx-message-01', 100, 120);
          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('ctx-message-01');
          });

          await clickMenuItemByLabel(page, 'Match');

          const match = await page.evaluate(() => window.model.log.filter.criterias.message.match);
          assert.strictEqual(match, 'first message\nctx-message-01');
        });

        it('should disable "Clear Filter" for regular fields when no filter is set', async () => {
          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear Filter'), true);
        });

        it('should enable "Clear Filter" for regular fields when a filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'match', 'some-host');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear Filter'), false);
        });
      });

      describe('From/To/Clear', async () => {
        it('should apply "from" action for timestamp fields', async () => {
          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);

          const menuValue = await page.evaluate(() => window.model.log.contextMenu.value);
          const expectedIso = await page.evaluate(() => window.model.timezone.parse(window.model.log.contextMenu.value)?.toISOString());
          await clickMenuItemByLabel(page, 'From');

          const criteria = await page.evaluate(() => ({
            since: window.model.log.filter.criterias.timestamp.since,
            $since: window.model.log.filter.criterias.timestamp.$since?.toISOString(),
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.since, menuValue);
          assert.strictEqual(criteria.$since, expectedIso);
          assert.strictEqual(criteria.isOpen, false);
        });

        it('should apply "to" action for timestamp fields', async () => {
          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);

          const menuValue = await page.evaluate(() => window.model.log.contextMenu.value);
          const expectedIso = await page.evaluate(() => window.model.timezone.parse(window.model.log.contextMenu.value)?.toISOString());
          await clickMenuItemByLabel(page, 'To');

          const criteria = await page.evaluate(() => ({
            until: window.model.log.filter.criterias.timestamp.until,
            $until: window.model.log.filter.criterias.timestamp.$until?.toISOString(),
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.until, menuValue);
          assert.strictEqual(criteria.$until, expectedIso);
          assert.strictEqual(criteria.isOpen, false);
        });

        it('should clear criteria for timestamp fields', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('timestamp', 'since', '17/05/2026 18:42:05.509');
            window.model.log.filter.setCriteria('timestamp', 'until', '17/05/2026 18:42:05.509');
          });
          await openContextMenu(page, 'timestamp', '17/05/2026 18:42:05.509', 100, 120);

          await clickMenuItemByLabel(page, 'Clear Filter');

          const criteria = await page.evaluate(() => ({
            since: window.model.log.filter.criterias.timestamp.since,
            $since: window.model.log.filter.criterias.timestamp.$since,
            until: window.model.log.filter.criterias.timestamp.until,
            $until: window.model.log.filter.criterias.timestamp.$until,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.since, '');
          assert.strictEqual(criteria.$since, null);

          assert.strictEqual(criteria.until, '');
          assert.strictEqual(criteria.$until, null);

          assert.strictEqual(criteria.isOpen, false);
        });

        it('should disable "Clear Filter" for timestamp when no filter is set', async () => {
          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear Filter'), true);
        });

        it('should enable "Clear Filter" for timestamp when a filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('timestamp', 'since', '17/05/2026 18:42:05.509');
          });

          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear Filter'), false);
        });
      });

      describe('Show/Hide/Reset for severity field', async () => {
        it('should disable "Show Severity" when severity is already active', async () => {
          await openContextMenu(page, 'severity', 'I', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Show Severity'), true);
          assert.strictEqual(await isMenuItemDisabled(page, 'Hide Severity'), false);
        });

        it('should toggle severity off via "Hide Severity"', async () => {
          let severity = await page.evaluate(() => window.model.log.filter.criterias.severity.$in);
          assert.ok(severity.includes('W'));
          await openContextMenu(page, 'severity', 'W', 100, 120);

          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('W');
          });
          await clickMenuItemByLabel(page, 'Hide Severity');

          severity = await page.evaluate(() => window.model.log.filter.criterias.severity.$in);
          assert.ok(!severity.includes('W'));
        });

        it('should disable "Hide Severity" when severity is already hidden', async () => {
          await page.evaluate(() => {
            window.model.log.setCriteria('severity', 'in', 'W');
          });

          await openContextMenu(page, 'severity', 'W', 100, 120);

          // wait 200ms with promise

          assert.strictEqual(await isMenuItemDisabled(page, 'Hide Severity'), true);
          assert.strictEqual(await isMenuItemDisabled(page, 'Show Severity'), false);
        });

        it('should reset severity filter to default', async () => {
          await page.evaluate(() => {
            window.model.log.setCriteria('severity', 'in', 'I');
          });

          await openContextMenu(page, 'severity', 'I', 100, 120);

          await clickMenuItemByLabel(page, 'Reset Severity Filter');

          const severity = await page.evaluate(() => ({
            in: window.model.log.filter.criterias.severity.in,
            $in: window.model.log.filter.criterias.severity.$in,
          }));

          assert.strictEqual(severity.in, 'I W E F');
          assert.deepStrictEqual(severity.$in, ['I', 'W', 'E', 'F']);
        });

        it('should disable "Reset Severity Filter" when all severities are already shown', async () => {
          await openContextMenu(page, 'severity', 'I', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Reset Severity Filter'), true);
        });
      });

      describe('Set/Reset Level Filter for level field', async () => {
        it('should set level to nearest threshold above via include', async () => {
          await openContextMenu(page, 'level', '3', 100, 120);

          await clickMenuItemByLabel(page, 'Set Level To Support');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, 6);
          assert.strictEqual(level.$max, 6);
        });

        it('should set level to nearest threshold below via exclude', async () => {
          await page.evaluate(() => {
            window.model.log.filter.resetCriteria();
          });

          await openContextMenu(page, 'level', '3', 100, 120);

          await clickMenuItemByLabel(page, 'Set Level To Ops');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, 1);
          assert.strictEqual(level.$max, 1);
        });

        it('should disable "Reset Level Filter" when level is already cleared', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('level', 'max', 1);
          });

          await openContextMenu(page, 'level', '3', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Reset Level Filter'), true);
        });

        it('should enable "Reset Level Filter" when a level filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('level', 'max', 6);
          });

          await openContextMenu(page, 'level', '3', 100, 120);

          assert.strictEqual(await isMenuItemDisabled(page, 'Reset Level Filter'), false);
        });

        it('should reset level filter back to default', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('level', 'max', 6);
          });

          await openContextMenu(page, 'level', '3', 100, 120);

          await clickMenuItemByLabel(page, 'Reset Level Filter');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, 1);
          assert.strictEqual(level.$max, 1);
        });
      });

      describe('Clipboard', async () => {
        before(async () => {
          await page.evaluate(() => {
            window.__copiedContextMenuValue = undefined;
          });
        });

        it('should copy value to clipboard', async () => {
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

          await clickMenuItemByLabel(page, 'Copy');

          const copied = await page.evaluate(async () => {
            await Promise.resolve();
            return {
              value: window.__copiedContextMenuValue,
              isOpen: window.model.log.contextMenu.isOpen,
            };
          });

          assert.strictEqual(copied.value, 'ctx-host-01');
          assert.strictEqual(copied.isOpen, false);
        });

        it('should show notification when clipboard write fails', async () => {
          await page.evaluate(() => {
            Object.defineProperty(navigator, 'clipboard', {
              value: {
                writeText: () => Promise.reject(new Error('Clipboard access denied')),
              },
              configurable: true,
            });
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Copy');

          await page.waitForFunction(() => window.model.notification.state === 'shown');
          const notification = await page.evaluate(() => ({
            message: window.model.notification.message,
            type: window.model.notification.type,
          }));

          assert.strictEqual(notification.message, 'Failed to copy to clipboard');
          assert.strictEqual(notification.type, 'danger');
        });
      });

      describe('Inspector', async () => {
        it('should open inspector via "Open Inspector"', async () => {
          await openContextMenu(page, 'message', 'ctx-message-01', 100, 120);

          await clickMenuItemByLabel(page, 'Open Inspector');

          const result = await page.evaluate(() => ({
            inspectorEnabled: window.model.inspectorEnabled,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(result.inspectorEnabled, true);
          assert.strictEqual(result.isOpen, false);
        });

        it('should not toggle inspector off if already open when clicking "Open Inspector"', async () => {
          await page.evaluate(() => {
            window.model.inspectorEnabled = true;
            window.model.notify();
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);

          await clickMenuItemByLabel(page, 'Open Inspector');

          const result = await page.evaluate(() => window.model.inspectorEnabled);

          assert.strictEqual(result, true);
        });
      });
    });
  });

  describe('Context hint button', async () => {
    beforeEach(async () => {
      await page.evaluate(() => {
        window.model.log.contextMenu.hide();
        window.model.log.setItem(null);
        window.model.notify();
      });
    });

    it('should render hint on cells with content', async () => {
      const cell = await page.evaluateHandle(() => Array.from(document.querySelectorAll('td.cell'))
        .find((cell) => cell.textContent.includes('ctx-host-01')));
      await cell.hover();

      const hintVisible = await page.evaluate(() => {
        const cell = Array.from(document.querySelectorAll('td.cell'))
          .find((c) => c.textContent.includes('ctx-host-01'));
        const hint = cell?.querySelector('.cell-context-menu-hint');
        return hint ? true : false;
      });

      assert.strictEqual(hintVisible, true);
    });

    it('should not render hint on cells with empty content', async () => {
      const emptyHints = await page.evaluate(() => {
        const emptyCells = Array.from(document.querySelectorAll('td.cell'))
          .filter((cell) => {
            const textEl = cell.querySelector('.cell-text');
            return textEl && textEl.textContent.trim() === '';
          });
        return emptyCells.filter((cell) => cell.querySelector('.cell-context-menu-hint')).length;
      });

      assert.strictEqual(emptyHints, 0);
    });

    it('should open context menu when hint is clicked', async () => {
      await page.evaluate(() => {
        const hint = Array.from(document.querySelectorAll('td.cell'))
          .find((cell) => cell.textContent.includes('ctx-host-01'))
          ?.querySelector('.cell-context-menu-hint');
        hint.click();
      });

      await page.waitForSelector('.cell-context-menu');
      assert.strictEqual(await isContextMenuOpen(page), true);
    });

    it('should select the row when hint is clicked', async () => {
      await page.evaluate(() => {
        const hint = Array.from(document.querySelectorAll('td.cell'))
          .find((cell) => cell.textContent.includes('ctx-host-01'))
          ?.querySelector('.cell-context-menu-hint');
        hint.click();
      });

      await page.waitForSelector('.cell-context-menu');
      const selectedHostname = await page.evaluate(() => window.model.log.item?.hostname);
      assert.strictEqual(selectedHostname, 'ctx-host-01');
    });
  });
});
