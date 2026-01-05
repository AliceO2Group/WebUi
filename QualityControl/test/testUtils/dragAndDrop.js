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
 * Helper to get the center of an element.
 * @param {object} page - Puppeteer page object.
 * @param {string} selector - Element selector to look for.
 * @returns {Promise<{x: number, y: number}>} A promise that resolves to the center x & y coordinates.
 */
export const getElementCenter = async (page, selector) => {
  const element = await page.waitForSelector(selector);
  const box = await element.boundingBox();
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2
  };
};
