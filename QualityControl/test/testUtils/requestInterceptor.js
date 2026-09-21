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
 * Intercepts and conditionally handles HTTP requests based on URL pattern matching.
 * This function evaluates whether a request's URL matches a specified regular expression pattern.
 * If the pattern matches, it delegates request handling to a provided callback function.
 * Otherwise, it allows the request to continue normally without intervention.
 * @param {import('puppeteer').HTTPRequest} request - The HTTP request object to be intercepted.
 * @param {RegExp} pathRegex - A regular expression pattern used to match against the request URL.
 * @param {(request: import('puppeteer').HTTPRequest) => Promise<void>} callback - A callback function,
 * invoked when the URL matches the pattern. Receives the request object as its parameter and is responsible
 * for handling the request (e.g., abort, respond, or continue).
 * @returns {void}
 * @example
 * // Block all image requests
 * await page.setRequestInterception(true);
 * page.on('request', (request) =>
 *   interceptRequest(request, /\.(jpg|jpeg|png|gif)$/i, (req) => req.abort())
 * );
 */
export const interceptRequest = async (request, pathRegex, callback) => {
  if (request.isInterceptResolutionHandled()) {
    // The interception has already been handled.
    return;
  }

  if (pathRegex.test(request.url())) {
    await callback(request);
  } else {
    await request.continue();
  }
};
