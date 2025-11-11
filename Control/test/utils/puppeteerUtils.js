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
 * Wait for a specific timeout period. To be used in puppeteer tests as the `waitForFunction` and `waitForNetworkIdle` are not reliable
 * Puppeteer used to have a built-in `waitForTimeout` function, but it was removed in later versions.
 * @param {number} timeout - The time to wait in milliseconds.
 * @returns {Promise<void>} - A promise that resolves after the specified timeout.
 */
export const waitForTimeout = (timeout) => new Promise((res) => setTimeout(res, timeout));
