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

/**
 * Get a value from the browser's localStorage for a given page.
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @param {string} storageKey - The key in localStorage to retrieve.
 * @returns {Promise<string | null>} Resolves to the stored string or null if not found.
 * @example
 * const token = await getLocalStorage(page, 'userToken');
 */
export const getLocalStorage = async (page, storageKey) =>
  await page.evaluate((key) => localStorage.getItem(key), storageKey);

/**
 * Set a value in the browser's localStorage for a given page.
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @param {string} storageKey - The key in localStorage to set.
 * @param {string} storageValue - The string value to store.
 * @returns {Promise<void>} Resolves when the value is set.
 * @example
 * await setLocalStorage(page, 'userToken', 'abc123');
 */
export const setLocalStorage = async (page, storageKey, storageValue) =>
  await page.evaluate((key, value) => localStorage.setItem(key, value), storageKey, storageValue);

/**
 * Get a JSON-parsed value from localStorage.
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @param {string} storageKey - The key in localStorage to retrieve.
 * @returns {Promise<JSON>} Resolves to the parsed JSON object, or throws if parsing fails.
 * @example
 * const userSettings = await getLocalStorageAsJson(page, 'settings');
 */
export const getLocalStorageAsJson = async (page, storageKey) =>
  JSON.parse(await getLocalStorage(page, storageKey));

/**
 * Set a JSON-serializable value in localStorage.
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @param {string} storageKey - The key in localStorage to set.
 * @param {JSON} storageValue - The value to store (will use `JSON.stringify`).
 * @returns {Promise<void>} Resolves when the value is set.
 * @example
 * await setLocalStorageAsJson(page, 'settings', { theme: 'dark' });
 */
export const setLocalStorageAsJson = async (page, storageKey, storageValue) =>
  await setLocalStorage(page, storageKey, JSON.stringify(storageValue));

/**
 * Remove a specific key from the browser's localStorage for a given page.
 * This function executes in the page context, so it must be called with
 * a Puppeteer/Page object.
 * @param {import('puppeteer').Page} page - The Puppeteer Page instance.
 * @param {string} storageKey - The key in localStorage to remove.
 * @returns {Promise<void>} Resolves when the item is removed.
 * @example
 * await removeLocalStorage(page, 'userToken');
 */
export const removeLocalStorage = async (page, storageKey) =>
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
