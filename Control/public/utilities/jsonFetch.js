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
 * Send a request to a remote endpoint, and extract the response. If errors occurred, an error containing a message field will be returned
 *
 * The endpoint is expected to follow some conventions:
 * - If request is valid but no data must be sent, it must return a 204
 * - If an error occurred, there can be error with a message field describing the error that occurred
 * @param {string} endpoint - the remote endpoint to send request to
 * @param {RequestInit} options - the request options, see {@see fetch } native function
 * @returns {Promise<Resolve<object>.Error<{message: string}>>} resolve with the result of the request or reject with the error message
 */
export const jsonFetch = async (endpoint, options) => {
  let response;
  try {
    response = await fetchClient(endpoint, options);
  } catch (error) {
    return Promise.reject({ message: 'Connection to server failed, please try again' });
  }
  try {
    const result = response.status === 204 // case in which response is empty
      ? null
      : await response.json();
    return response.ok
      ? result
      : Promise.reject({ message: result.message || 'Unknown error received' });
  } catch (error) {
    return Promise.reject({ message: 'Parsing result from server failed' });
  }
};
