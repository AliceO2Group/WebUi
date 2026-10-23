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
 * Send a request to an endpoint, and extract the response. If errors occurred, return an error containing a message.
 *
 * The endpoint is expected to follow some conventions:
 * - If request is valid but no data was sent as response, it must return a 204
 * - If an error occurred on the backend:
 *   - request can be status ok with {message: string} body describing the error
 *   - or request can be status error with or without body that contains a message field describing the error
 * - If request is valid and data is sent as response, it must return a json with the expected data
 * @param {string} endpoint - the remote endpoint to send request to
 * @param {RequestInit} options - the request options, see {@link fetch } native function
 * (method, headers, body, abort.signal, etc.)
 * @returns {Promise<Resolve<object>.Error<{message: string}>>} resolve with the result or reject with the error message
 */
export const jsonFetch = async (endpoint, options) => {
  try {
    const response = await fetchClient(endpoint, options);
    if (response.status === 204) {
      return null;
    }

    const result = await response.json();

    if (response.ok) {
      return result;
    }

    const serverMessage = result && typeof result.message === 'string'
      ? result.message
      : null;

    throw new Error(serverMessage || `Request failed with status ${response.status}`);
  } catch (error) {
    if (error && typeof error.message === 'string') {
      throw error;
    }
    throw new Error('Parsing result from server failed', { cause: error });
  }
};
