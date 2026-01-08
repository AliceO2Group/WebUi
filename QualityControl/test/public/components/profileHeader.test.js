/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { doesNotMatch, match, ok, strictEqual } from 'node:assert';
import { delay } from '../../testUtils/delay.js';
import { StorageKeysEnum } from '../../../public/common/enums/storageKeys.enum.js';
import { getLocalStorageAsJson } from '../../testUtils/localStorage.js';
import { Transition } from '../../../common/library/enums/transition.enum.js';

/**
 * Performs a series of automated tests on the layoutList page using Puppeteer.
 * @param {string} url - URL needed to open page for testing
 * @param {object} page - Puppeteer page object
 * @param {number} timeout - Timeout PER test; default 100
 * @param {object} testParent - Node.js test object which ensures subtests are being awaited
 */
export const profileHeaderTests = async (url, page, timeout = 1000, testParent) => {
  await testParent.test('should load', { timeout }, async () => {
    await page.goto(`${url}?page=layoutList`, { waitUntil: 'networkidle0' });
    const location = await page.evaluate(() => window.location);

    strictEqual(location.search, '?page=layoutList');
  });

  await testParent.test('should have an account button', async () => {
    const accountButtonExists = await page.evaluate(() =>
      document.querySelector('header div[title="Login"] button.btn') !== null);

    ok(accountButtonExists);
  });

  await testParent.test('clicking the account button opens a dropdown', { timeout }, async () => {
    const selector = 'header div[title="Login"]';
    const locator = 'header div[title="Login"] button.btn';

    let classNames = await page.evaluate((query) => document.querySelector(query).className, selector);
    doesNotMatch(classNames, /\bdropdown-open\b/, 'Account dropdown should not be open before clicking');

    await page.locator(locator).click();
    await delay(100);
    classNames = await page.evaluate((query) => document.querySelector(query).className, selector);
    match(classNames, /\bdropdown-open\b/, 'Account dropdown should be open after clicking');

    await page.locator(locator).click();
    await delay(100);
    classNames = await page.evaluate((query) => document.querySelector(query).className, selector);
    doesNotMatch(classNames, /\bdropdown-open\b/, 'Account dropdown should be closed after clicking again');
  });

  await testParent.test('toggling the "notify on run start" setting updates LocalStorage', { timeout }, async () => {
    const locator = 'header div[title="Login"] .dropdown-menu .switch';
    const selector = `${locator} input[type="checkbox"]`;
    const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
    const localStorageKey = `${StorageKeysEnum.NOTIFICATION_START_RUN_SETTING}-${personId}`;
    const context = page.browserContext();
    let switchValue = undefined;
    let storageValue = undefined;
    if (!personId) {
      throw new Error('Could not resolve personId from the application model');
    }

    try {
      // Grant notification permissions
      await context.overridePermissions(url, ['notifications']);

      // Open the dropdown
      await page.locator('header div[title="Login"] button.btn').click();

      switchValue = await page.evaluate((query) => document.querySelector(query).checked, selector);
      storageValue = await getLocalStorageAsJson(page, localStorageKey);
      strictEqual(switchValue, false, 'Setting "notify on run start" should be disabled');
      strictEqual(storageValue, null, 'Should not have a stored setting for "notify on run start"');

      await page.locator(locator).click();
      await page.waitForFunction(
        (query, expected) => document.querySelector(query).checked === expected,
        {},
        selector,
        true,
      );
      switchValue = await page.evaluate((query) => document.querySelector(query).checked, selector);
      storageValue = await getLocalStorageAsJson(page, localStorageKey);
      strictEqual(switchValue, true, 'Setting "notify on run start" should be enabled');
      strictEqual(storageValue, true, 'Should have a stored value "true" for setting "notify on run start"');

      await page.locator(locator).click();
      await page.waitForFunction(
        (query, expected) => document.querySelector(query).checked === expected,
        {},
        selector,
        false,
      );
      switchValue = await page.evaluate((query) => document.querySelector(query).checked, selector);
      storageValue = await getLocalStorageAsJson(page, localStorageKey);
      strictEqual(switchValue, false, 'Setting "notify on run start" should be disabled');
      strictEqual(storageValue, false, 'Should have a stored value "false" for setting "notify on run start"');
    } finally {
      context.clearPermissionOverrides();
    }
  });

  await testParent.test('setting "notify on run start" should be loaded from LocalStorage', { timeout }, async () => {
    const switchButtonLocator = 'header div[title="Login"] .dropdown-menu .switch';
    const checkboxSelector = `${switchButtonLocator} input[type="checkbox"]`;
    const accountButtonLocator = 'header div[title="Login"] button.btn';
    // Resolve LocalStorage key dynamically based on personId
    const personId = await page.evaluate(() => window.model?.session?.personid?.toString());
    const localStorageKey = `${StorageKeysEnum.NOTIFICATION_START_RUN_SETTING}-${personId}`;
    const context = page.browserContext();
    if (!personId) {
      throw new Error('Could not resolve personId from the application model');
    }

    /**
     * @typedef {object} SwitchState
     * @property {boolean} switchBefore - Switch checked state before page reload
     * @property {JSON} storageBefore - LocalStorage value before page reload
     * @property {boolean} switchAfter - Switch checked state after page reload
     * @property {JSON} storageAfter - LocalStorage value after page reload
     */

    /**
     * Reads the switch state and LocalStorage before and after a reload.
     * @returns {Promise<SwitchState>} Object containing switch and LocalStorage values before and after page reload.
     */
    const readSwitchStateBeforeAndAfterReload = async () => {
      // Read before reload
      const switchBefore = await page.evaluate((query) => document.querySelector(query).checked, checkboxSelector);
      const storageBefore = await getLocalStorageAsJson(page, localStorageKey);

      // Reload the page
      await page.reload({ waitUntil: 'networkidle0' });

      // Open the dropdown
      await page.locator(accountButtonLocator).click();
      await page.waitForFunction(() =>
        /\bdropdown-open\b/.test(document.querySelector('header div[title="Login"]').className));

      // Read after reload
      const switchAfter = await page.evaluate((query) => document.querySelector(query).checked, checkboxSelector);
      const storageAfter = await getLocalStorageAsJson(page, localStorageKey);

      return { switchBefore, storageBefore, switchAfter, storageAfter };
    };

    try {
      // Grant notification permissions
      await context.overridePermissions(url, ['notifications']);

      // Verify default disabled state persists across reload
      const disabledState = await readSwitchStateBeforeAndAfterReload();
      strictEqual(
        disabledState.switchBefore,
        disabledState.switchAfter,
        'Switch state should persist when disabled',
      );
      strictEqual(
        disabledState.storageBefore,
        disabledState.storageAfter,
        'LocalStorage value should persist when disabled',
      );

      // Enable the setting
      await page.locator(switchButtonLocator).click();
      await page.waitForFunction(
        (query) => document.querySelector(query).checked === true,
        {},
        checkboxSelector,
      );

      // Verify enabled state persists across reload
      const enabledState = await readSwitchStateBeforeAndAfterReload();
      strictEqual(
        enabledState.switchBefore,
        enabledState.switchAfter,
        'Switch state should persist when enabled',
      );
      strictEqual(
        enabledState.storageBefore,
        enabledState.storageAfter,
        'LocalStorage value should persist when enabled',
      );
    } finally {
      context.clearPermissionOverrides();
    }
  });

  await testParent.test('should enable RunMode when native browser notification is clicked', { timeout }, async () => {
    await page.goto(`${url}?page=objectTree`, { waitUntil: 'networkidle0' });
    const context = page.browserContext();

    try {
      // Grant notification permissions
      await context.overridePermissions(url, ['notifications']);

      // Inject a runtime Notification mock
      await page.evaluate(() => {
        window.__originalNotification = window.Notification;
        window.__lastNotification = null;

        class MockNotification {
          /**
           * `MockNotification` constructor
           * @param {string} title = Notification title
           * @param {object} options - Notification options
           */
          constructor(title, options) {
            this.title = title;
            this.options = options;

            // Save instance so test can access it
            window.__lastNotification = this;
          }

          close() {}

          static permission = 'granted';

          static requestPermission() {
            return Promise.resolve('granted');
          }
        }

        window.Notification = MockNotification;
      });

      // Trigger native browser notification by simulating websocket message
      await page.evaluate(
        (wsMessage) => window.model.notificationRunStartModel._handleWSRunTrack(wsMessage),
        { runNumber: 1234, transition: Transition.START_ACTIVITY },
      );
      // `window.__lastNotification` is set by the mocked `Notification`
      await page.waitForFunction(() => window.__lastNotification !== null);

      let selectedRun = await page.evaluate(() => document.querySelector('select#ongoingRunsFilter')?.value);
      strictEqual(selectedRun, undefined, 'Should not have a run selected in RunMode before clicking the notification');

      await page.evaluate(() => {
        if (typeof window.__lastNotification.onclick === 'function') {
          window.__lastNotification.onclick();
        }
      });
      await page.waitForFunction(() =>
        document.querySelector('#run-mode-switch .switch input[type="checkbox"]')?.checked === true);

      selectedRun = await page.evaluate(() => document.querySelector('select#ongoingRunsFilter')?.value);
      strictEqual(
        selectedRun,
        '1234',
        'Should have the newly started run selected in RunMode after clicking the notification',
      );
    } finally {
      context.clearPermissionOverrides();
      // Remove mocked Notification
      await page.evaluate(() => {
        if (window.__originalNotification) {
          window.Notification = window.__originalNotification;
        }
      });
    }
  });
};
