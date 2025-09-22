/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * Add a bit of waiting time to ensure page finished rendering
 * @param {number} ms - Time in milliseconds to wait
 * @returns {Promise<void>}
 */
export const delay = (ms = 500) => new Promise((resolve) => setTimeout(() => resolve(), ms));

/**
 * Delay until a condition is met or a timeout occurs
 * @param {Function} conditionFunc - Function that returns a boolean indicating if the condition is met
 * @param {number} ms - Time in milliseconds to wait between checks
 * @param {number} maxRetries - Maximum number of retries before giving up
 * @returns {Promise<void>}
 */
export const delayAndCheck = async (conditionFunc, ms = 500, maxRetries = 10) => {
  let retries = 0;
  while (retries < maxRetries) {
    if (conditionFunc()) {
      return;
    }
    await delay(ms);
    retries += 1;
  }
};
