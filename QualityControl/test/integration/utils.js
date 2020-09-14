
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
 * Wait for response from QuailtyControl
 * Method will check if loader is still active (requests still pending) every second
 * for a specified amount of seconds (default 90)
 * @param {Object} page
 * @param {number} timeout - seconds
 * @return {Promise}
 */
module.exports.waitForQCResponse = (page, timeout = 90) => {
  return new Promise(async (resolve) => {
    let i = 0;
    while (i++ < timeout) {
      const isLoaderActive = await page.evaluate(() => window.model.loader.active);
      if (!isLoaderActive) {
        await page.waitFor(1000);
        resolve();
      } else {
        await page.waitFor(1000);
      }
    }
  });
};
