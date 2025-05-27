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

import http from 'http';
import https from 'https';

/**
 * Performs an HTTP GET request and parses the JSON response.
 * @param {string} hostname - Target server hostname.
 * @param {number} port - Target server port.
 * @param {string} path - Request path.
 * @param {object} options - Additional HTTP options.
 * @returns {Promise<object>} - Parsed JSON response.
 */
export function httpGetJson(hostname, port, path, options) {
  const httpOptions = getHttpOptions(options);
  const requestOptions = buildRequestOptions('GET', hostname, port, path, httpOptions);
  const client = getClient(httpOptions.protocol);

  return new Promise((resolve, reject) => {
    const request = client.request(requestOptions, (res) => {
      handleJsonResponse(res, httpOptions)
        .then(resolve)
        .catch(reject);
    });

    request.on('error', reject);
    request.end();
  });
}

/**
 * Performs an HTTP HEAD request and returns status and headers.
 * @param {string} hostname - Target server hostname.
 * @param {number} port - Target server port.
 * @param {string} path - Request path.
 * @param {object} options - Additional HTTP options.
 * @returns {Promise<{status: number, headers: object}>}
 */
export function httpHeadJson(hostname, port, path, options) {
  const httpOptions = getHttpOptions(options);
  const requestOptions = buildRequestOptions('HEAD', hostname, port, path, httpOptions);
  const client = getClient(httpOptions.protocol);

  return new Promise((resolve, reject) => {
    const request = client.request(requestOptions, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });

    request.on('error', reject);
    request.end();
  });
}

/**
 * Parses JSON response and validates status code range.
 * @param {http.IncomingMessage} response - HTTP response object.
 * @param {object} options - HTTP options including status code range.
 * @returns {Promise<object>} - Parsed JSON response.
 */
function handleJsonResponse(response, options) {
  return new Promise((resolve, reject) => {
    const { statusCode } = response;

    if (statusCode < options.statusCodeMin || statusCode > options.statusCodeMax) {
      return reject(new Error(`${options.rejectMessage}${statusCode}`));
    }

    const chunks = [];
    response.on('data', (chunk) => chunks.push(chunk));
    response.on('end', () => {
      try {
        const body = JSON.parse(chunks.join(''));
        resolve(body);
      } catch {
        reject(new Error('Unable to parse JSON'));
      }
    });
  });
}

/**
 * Builds the full HTTP request options object.
 * @param {string} method - HTTP method (GET, HEAD).
 * @param {string} hostname
 * @param {number} port
 * @param {string} path
 * @param {object} options - Merged HTTP options.
 * @returns {object} - Request options compatible with http(s).request
 */
function buildRequestOptions(method, hostname, port, path, options) {
  return {
    hostname,
    port,
    path,
    method,
    rejectUnauthorized: Boolean(options.rejectUnauthorized),
    headers: options.headers,
  };
}

/**
 * Merges default options with user-provided overrides.
 * @param {object} [options={}] - User-provided options.
 * @returns {object} - Final options.
 */
function getHttpOptions(options = {}) {
  return {
    statusCodeMin: 200,
    statusCodeMax: 299,
    rejectMessage: 'Non-2xx status code: ',
    protocol: 'http:',
    rejectUnauthorized: true,
    headers: {
      Accept: 'application/json',
    },
    ...options ?? {},
  };
}

/**
 * Returns the correct HTTP(S) client based on protocol.
 * @param {string} protocol - 'http:' or 'https:'
 * @returns {typeof http | typeof https}
 */
function getClient(protocol) {
  return protocol === 'https:' ? https : http;
}
