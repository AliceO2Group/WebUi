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
  openContextMenu,
  waitForMatchExcludeButtons,
  waitForFromToButtons,
  waitForSeverityButtons,
  waitForLevelButtons,
  isMenuItemDisabled,
  clickMenuItemByLabel,
} = require('./context-menu-test-utils');

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

  let baseUrl = null;
  let page = null;

  before(async () => {
    ({ baseUrl } = test.helpers);
    ({ page } = test);

    await page.goto(`${baseUrl}?profile=physicist`, { waitUntil: 'networkidle0' });

    await page.evaluate((exampleRow) => {
      window.confirm = () => false;
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

  beforeEach(async () => {
    await page.evaluate(() => {
      window.model.log.filter.resetCriteria();
      window.model.log.hideContextMenu();
    });
  });

  describe('Menu visibility', async () => {
    it('should show context menu on right-click', async () => {
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

    it('should show hover tooltip on table rows', async () => {
      const title = await page.evaluate(() => {
        const row = document.querySelector('tr.row-hover');
        return row?.getAttribute('title');
      });
      assert.strictEqual(title, 'Right-click for more options');
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
        await waitForMatchExcludeButtons(page);
      });

      it('should show correct actions for From/To fields', async () => {
        await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
        await waitForFromToButtons(page);
      });

      it('should show correct actions for severity field', async () => {
        await openContextMenu(page, 'severity', 'I', 100, 120);
        await waitForSeverityButtons(page);
      });

      it('should show correct actions for level field', async () => {
        await openContextMenu(page, 'level', '3', 100, 120);
        await waitForLevelButtons(page);
      });
    });

    describe('Menu actions functionality', async () => {
      describe('Match/Exclude/Clear', async () => {
        it('should apply "match" action for regular fields', async () => {
          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await waitForMatchExcludeButtons(page);
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
          await waitForMatchExcludeButtons(page);
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
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await waitForMatchExcludeButtons(page);
          await clickMenuItemByLabel(page, 'Clear filter');

          const criteria = await page.evaluate(() => ({
            match: window.model.log.filter.criterias.hostname.match,
            $match: window.model.log.filter.criterias.hostname.$match,
            exclude: window.model.log.filter.criterias.hostname.exclude,
            $exclude: window.model.log.filter.criterias.hostname.$exclude,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(criteria.match, '');
          assert.strictEqual(criteria.$match, null);
          assert.strictEqual(criteria.exclude, '');
          assert.strictEqual(criteria.$exclude, null);
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
          await waitForMatchExcludeButtons(page);
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
          await waitForMatchExcludeButtons(page);
          await clickMenuItemByLabel(page, 'Exclude');

          const exclude = await page.evaluate(() => window.model.log.filter.criterias.hostname.exclude);
          assert.strictEqual(exclude, 'existing-host ctx-host-01');
        });

        it('should not duplicate value when appending to filter', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'match', 'ctx-host-01');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await waitForMatchExcludeButtons(page);
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
          await waitForMatchExcludeButtons(page);
          await clickMenuItemByLabel(page, 'Match');

          const match = await page.evaluate(() => window.model.log.filter.criterias.message.match);
          assert.strictEqual(match, 'first message\nctx-message-01');
        });

        it('should disable "Clear filter" for regular fields when no filter is set', async () => {
          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await waitForMatchExcludeButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear filter'), true);
        });

        it('should enable "Clear filter" for regular fields when a filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('hostname', 'match', 'some-host');
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120);
          await waitForMatchExcludeButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear filter'), false);
        });
      });

      describe('From/To/Clear', async () => {
        it('should apply "from" action for timestamp fields', async () => {
          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
          await waitForFromToButtons(page);

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
          await waitForFromToButtons(page);

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
          await waitForFromToButtons(page);
          await clickMenuItemByLabel(page, 'Clear filter');

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

        it('should disable "Clear filter" for timestamp when no filter is set', async () => {
          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
          await waitForFromToButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear filter'), true);
        });

        it('should enable "Clear filter" for timestamp when a filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('timestamp', 'since', '17/05/2026 18:42:05.509');
          });

          await openContextMenu(page, 'timestamp', '2024-05-11T10:20:30.000Z', 100, 120);
          await waitForFromToButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear filter'), false);
        });
      });

      describe('Show/Hide/Reset for severity field', async () => {
        it('should disable "Show severity" when severity is already active', async () => {
          await openContextMenu(page, 'severity', 'I', 100, 120);
          await waitForSeverityButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Show severity'), true);
          assert.strictEqual(await isMenuItemDisabled(page, 'Hide severity'), false);
        });

        it('should toggle severity off via "Hide severity"', async () => {
          let severity = await page.evaluate(() => window.model.log.filter.criterias.severity.$in);
          assert.ok(severity.includes('W'));
          await openContextMenu(page, 'severity', 'W', 100, 120);
          await waitForSeverityButtons(page);
          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('W');
          });
          await clickMenuItemByLabel(page, 'Hide severity');

          severity = await page.evaluate(() => window.model.log.filter.criterias.severity.$in);
          assert.ok(!severity.includes('W'));
        });

        it('should disable "Hide severity" when severity is already hidden', async () => {
          await page.evaluate(() => {
            window.model.log.setCriteria('severity', 'in', 'W');
          });

          await openContextMenu(page, 'severity', 'W', 100, 120);
          await waitForSeverityButtons(page);
          // wait 200ms with promise

          assert.strictEqual(await isMenuItemDisabled(page, 'Hide severity'), true);
          assert.strictEqual(await isMenuItemDisabled(page, 'Show severity'), false);
        });

        it('should reset severity filter to default', async () => {
          await page.evaluate(() => {
            window.model.log.setCriteria('severity', 'in', 'I');
          });

          await openContextMenu(page, 'severity', 'I', 100, 120);
          await waitForSeverityButtons(page);
          await clickMenuItemByLabel(page, 'Reset severity filter');

          const severity = await page.evaluate(() => ({
            in: window.model.log.filter.criterias.severity.in,
            $in: window.model.log.filter.criterias.severity.$in,
          }));

          assert.strictEqual(severity.in, 'I W E F');
          assert.deepStrictEqual(severity.$in, ['I', 'W', 'E', 'F']);
        });

        it('should disable "Reset severity filter" when all severities are already shown', async () => {
          await openContextMenu(page, 'severity', 'I', 100, 120);
          await waitForSeverityButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Reset severity filter'), true);
        });
      });

      describe('Set/Clear level filter for level field', async () => {
        it('should set level to nearest threshold above via include', async () => {
          await openContextMenu(page, 'level', '3', 100, 120);
          await waitForLevelButtons(page);
          await clickMenuItemByLabel(page, 'Set level to Support');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, 6);
          assert.strictEqual(level.$max, 6);
        });

        it('should set level to nearest threshold below via exclude', async () => {
          await page.evaluate(() => {
            window.model.log.filter.resetCriteria();
          });

          await openContextMenu(page, 'level', '3', 100, 120);
          await waitForLevelButtons(page);
          await clickMenuItemByLabel(page, 'Set level to Ops');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, 1);
          assert.strictEqual(level.$max, 1);
        });

        it('should disable "Clear level filter" when no level filter is set', async () => {
          await openContextMenu(page, 'level', '3', 100, 120);
          await waitForLevelButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear level filter'), true);
        });

        it('should enable "Clear level filter" when a level filter is active', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('level', 'max', 6);
          });

          await openContextMenu(page, 'level', '3', 100, 120);
          await waitForLevelButtons(page);

          assert.strictEqual(await isMenuItemDisabled(page, 'Clear level filter'), false);
        });

        it('should clear level filter back to null', async () => {
          await page.evaluate(() => {
            window.model.log.filter.setCriteria('level', 'max', 6);
          });

          await openContextMenu(page, 'level', '3', 100, 120);
          await waitForLevelButtons(page);
          await clickMenuItemByLabel(page, 'Clear level filter');

          const level = await page.evaluate(() => window.model.log.filter.criterias.level);
          assert.strictEqual(level.max, null);
          assert.strictEqual(level.$max, null);
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
          await waitForMatchExcludeButtons(page);
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
          await waitForMatchExcludeButtons(page);
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
        it('should open inspector and select the right-clicked row via "Open Inspector"', async () => {
          await openContextMenu(page, 'message', 'ctx-message-01', 100, 120, exampleRow);
          await waitForMatchExcludeButtons(page);
          // wait for the menu to have the ctx-message-01 label to ensure the menu has rendered for the correct row before clicking
          await page.waitForFunction(() => {
            const menu = document.querySelector('.cell-context-menu');
            return menu && menu.textContent.includes('ctx-message-01');
          });
          await clickMenuItemByLabel(page, 'Open Inspector');

          const result = await page.evaluate(() => ({
            inspectorEnabled: window.model.inspectorEnabled,
            selectedMessage: window.model.log.item?.message,
            isOpen: window.model.log.contextMenu.isOpen,
          }));

          assert.strictEqual(result.inspectorEnabled, true);
          assert.strictEqual(result.selectedMessage, 'ctx-message-01');
          assert.strictEqual(result.isOpen, false);
        });

        it('should not toggle inspector off if already open when clicking "Open Inspector"', async () => {
          await page.evaluate(() => {
            window.model.inspectorEnabled = true;
            window.model.notify();
          });

          await openContextMenu(page, 'hostname', 'ctx-host-01', 100, 120, exampleRow);
          await waitForMatchExcludeButtons(page);
          await clickMenuItemByLabel(page, 'Open Inspector');

          const result = await page.evaluate(() => ({
            inspectorEnabled: window.model.inspectorEnabled,
            selectedMessage: window.model.log.item?.message,
          }));

          assert.strictEqual(result.inspectorEnabled, true);
          assert.strictEqual(result.selectedMessage, 'ctx-message-01');
        });
      });
    });
  });
});
