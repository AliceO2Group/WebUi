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
 * Gets a value from LocalStorage for the current user.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {string} keyPrefix - The prefix for the LocalStorage key.
 * @returns {Promise<string|null>} The stored value or null if not found.
 */
export const getUserLocalStorageValue = async (page, keyPrefix) =>
  page.evaluate((prefix) => {
    const personId = window.model.session.personid.toString();
    const key = `${prefix}-${personId}`;
    return window.localStorage.getItem(key);
  }, keyPrefix);

/**
 * Sets or removes a LocalStorage value for the current user.
 * @param {import('puppeteer').Page} page - Puppeteer page instance.
 * @param {string} keyPrefix - The prefix for the LocalStorage key.
 * @param {string|number|boolean|null} value - Value to store; if `null`, the key is removed.
 * @returns {Promise<void>}
 */
export const setUserLocalStorageValue = async (page, keyPrefix, value) =>
  page.evaluate(
    (prefix, v) => {
      const personId = window.model.session.personid.toString();
      const key = `${prefix}-${personId}`;
      if (v !== null && v !== undefined) {
        window.localStorage.setItem(key, String(v));
      } else {
        window.localStorage.removeItem(key);
      }
    },
    keyPrefix,
    value,
  );
