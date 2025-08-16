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
 * Given an existing object of used parameters and new ones to add/update, return a string with desired URL format
 * @param {object} currentParameters - current parameters in the URL
 * @param {object} parameters - object containing what parameters should be added or updated
 * @returns {string} - updated URL
 */
export function buildQueryParametersString(currentParameters, parameters) {
  Object.assign(currentParameters, parameters);
  let url = '?';

  Object.keys(currentParameters).forEach((param) => {
    url += `${param}=${currentParameters[param]}&`;
  });
  return url.substring(0, url.length - 1);
}
