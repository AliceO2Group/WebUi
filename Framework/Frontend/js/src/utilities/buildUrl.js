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
 * @typedef {string|number|null|boolean} QueryParameterValue
 */

import { parseUrlParameters } from './parseUrlParameters.js';

/**
 * Build a URL from a base URL (that may already have query parameters) and a list of query parameters
 *
 * @param {string} baseURL the base URL to which parameters should be added
 * @param {object} parameters the query parameters
 * @return {string} URL the built URL
 */
export const buildUrl = (baseURL, parameters) => {
  if (!parameters) {
    parameters = {};
  }
  const [url, existingParameters] = baseURL.split('?');

  parseUrlParameters(existingParameters, parameters);

  const serializedQueryParameters = [];

  if (Object.keys(parameters).length === 0) {
    return url;
  }

  /**
   * Sanitize a value to be used as URL parameter key or value
   *
   * @param {string} value the value to sanitize
   * @return {string} the sanitized value
   */
  const sanitize = (value) => encodeURIComponent(decodeURIComponent(value));

  /**
   * Stringify a query parameter to be used in a URL and push it in the serialized query parameters list
   *
   * @param {string} key the parameter's key
   * @param {QueryParameterValue} value the parameter's value
   * @return {void}
   */
  const formatAndPushQueryParameter = (key, value) => {
    if (value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      for (const subValue of value) {
        formatAndPushQueryParameter(`${key}[]`, subValue);
      }
      return;
    }

    if (typeof value === 'object' && value !== null) {
      for (const [subKey, subValue] of Object.entries(value)) {
        formatAndPushQueryParameter(`${key}[${sanitize(subKey)}]`, subValue);
      }
      return;
    }

    serializedQueryParameters.push(`${key}=${sanitize(value)}`);
  };

  for (const [key, parameter] of Object.entries(parameters)) {
    formatAndPushQueryParameter(sanitize(key), parameter);
  }

  return `${url}?${serializedQueryParameters.join('&')}`;
};
