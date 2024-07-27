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

/* Global: window */

import sessionService from './sessionService.js';

const { location } = window;

/**
 * Extends the fetch() function by adding the session token in the request
 * by taking it from sessionService transparently for developer.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @param {...any} args - arguments to pass to fetch
 * @return {object} options - method, etc.
 * @example
 * import {fetchClient} from '/js/src/index.js';
 * const options = {
 *   method: 'POST',
 *   headers: {
 *     'Accept': 'application/json',
 *     'Content-Type': 'application/json'
 *   },
 *   body: JSON.stringify({...})
 * };
 * const response = await fetchClient('/api/lock', options);
 */
function fetchClient(...args) {
  if (!args[0]) {
    throw new Error('argument needed');
  }

  const session = sessionService.get();

  /*
   * Parse the URI provided
   * Location brings the base if first arg is relative
   */
  const url = new URL(args[0], location);

  // Inject the token in the query string
  url.searchParams.append('token', session.token);

  // Reset the URI with the new URI
  args[0] = url.toString();

  return fetch(...args);
}

export default fetchClient;
