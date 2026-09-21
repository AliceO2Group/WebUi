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
 * @example
 * { page: 'test', filter: { name: 'mylayout', objectPath: 'test' } }
 * results in:
 * ?page=test&filter[name]=mylayout&filter[objectPath]=test
 * @param {object} currentParameters - current parameters in the URL
 * @param {object} parameters - object containing what parameters should be added or updated
 * @returns {string} - updated URL
 */
export function buildQueryParametersString(currentParameters, parameters) {
  Object.assign(currentParameters, parameters);
  let url = '?';

  /**
   * Encodes a parameter for URL query string, supporting nested objects.
   * @param {string} key - The parameter key
   * @param {string|object} value - The parameter value, string or nested object
   * @returns {string} Encoded parameter string
   */
  function encodeParam(key, value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.keys(value)
        .map((subKey) => `${key}[${subKey}]=${encodeURIComponent(value[subKey])}`)
        .join('&');
    } else {
      return `${key}=${encodeURIComponent(value)}`;
    }
  }

  url += Object.keys(currentParameters)
    .map((param) => encodeParam(param, currentParameters[param]))
    .filter(Boolean)
    .join('&');
  return url;
}
