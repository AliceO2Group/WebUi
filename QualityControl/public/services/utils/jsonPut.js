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

import { jsonFetch } from './jsonFetch.js';

/**
 * Build and send a PUT request to a remote endpoint, and extract the response.
 * @param {string} endpoint - the remote endpoint to send request to
 * @param {RequestInit} options - the request options, see {@see fetch } native function
 * @returns {Promise<Resolve<object>>} resolve with the result of the request or reject with the error message
 * @rejects {Error<{message: string}>}
 */
export const jsonPut = async (endpoint, options) => {
  if (options.body && typeof options.body === 'object') {
    options.body = JSON.stringify(options.body);
  }
  try {
    const result = await jsonFetch(endpoint, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      ...options,
    });
    return result;
  } catch (error) {
    return Promise.reject({ message: error.message || error });
  }
};
