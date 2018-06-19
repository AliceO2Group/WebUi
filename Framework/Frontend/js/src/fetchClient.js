/* global: window */

import sessionService from './sessionService.js';

const location = window.location;

/**
 * Extends the fetch() function by adding the session token in the request
 * by taking it from sessionService transparently for developer.
 * See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @param {string} URL
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

  // Parse the URI provided
  // location brings the base if first arg is relative
  const url = new URL(args[0], location);

  // Inject the token in the query string
  url.searchParams.append('token', session.token);

  // Reset the URI with the new URI
  args[0] = url.toString();

  return fetch(...args);
}

export default fetchClient;
