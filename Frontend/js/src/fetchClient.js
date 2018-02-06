import sessionService from '/js/src/sessionService.js';

/**
 * Extends the fetch() function by adding the session token in the request
 * @param {string} argName - blabla
 * @return {string} blabla
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


