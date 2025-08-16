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
 * Given an object with K;V pairs, build a URL component and return it as string
 * @example
 * { RunNumber: 42, PassName: 1 } -> '&RunUmber=42&PassName=1'
 * @param {object} filter - filters as KV pairs
 * @returns {string} - partial URL
 */
export const getUrlPathFromObject = (filter) => {
  let urlPath = '';
  if (Object.keys(filter).length > 0) {
    urlPath = Object.entries(filter)
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
  }
  return urlPath;
};
