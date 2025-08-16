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

import { fetchClient } from '/js/src/index.js';

/**
 * Build and send a PUT request to a remote endpoint, and extract the response.
 * @param {string} endpoint - the remote endpoint to send request to
 * @param {RequestInit} options - the request options, see {@see fetch } native function
 * @returns {Promise<Resolve<object>>} resolve with the result of the request
 * @rejects {Error<{message: string}>}
 */
export const jsonFetch = async (endpoint, options) => {
  let response = {};
  try {
    response = await fetchClient(endpoint, options);
  } catch {
    return Promise.reject({ message: 'Connection to server failed, please try again' });
  }
  try {
    const result = response.status === 204 // case in which response is empty
      ? null
      : await response.json();
    return response.ok
      ? result
      : Promise.reject({ message: result.message || 'Unknown error received' });
  } catch {
    return Promise.reject({ message: 'Parsing result from server failed' });
  }
};
