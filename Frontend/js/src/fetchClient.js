/* global: window */

import sessionService from '/js/src/sessionService.js';

const location = window.location;

/**
 * Extends the fetch() function by adding the session token in the request
 * See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 * @param {string} URL
 * @return {object} options - method, etc.
 */
export default function fetchClient(...args) {
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


