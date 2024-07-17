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

import { Log } from '@aliceo2/web-ui';
const log = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/utils`);
import http from 'http';

/**
 * Global HTTP error handler, sends status 500
 * @param {string} errToLog - Error for qcg own logs
 * @param {string} errToSend - Error to be stored in InfoLogger for user investigation
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 * @param {string} facility - service that sends the log
 * @returns {void}
 */
export function errorHandler(errToLog, errToSend, res, status = 500, facility = 'utils') {
  errorLogger(errToLog, facility);
  res.status(status).send({ message: errToSend.message || errToSend });
}

/**
 * Global Error Logger for AliECS GUI
 * @param {Error} err - error that should be logged
 * @param {string} facility - service that sends the log
 * @returns {void}
 */
export function errorLogger(err, facility = 'utils') {
  log.facility = `${process.env.npm_config_log_label ?? 'qcg'}/${facility}`;
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
}

/**
 * Util to get JSON data (parsed) from server via a GET HTTP request
 * @param {string} hostname - hostname of the server to where request will be made
 * @param {number} port - port of the server to where request will be made
 * @param {string} path - path of the server request to where request will be made
 * @param {JSON} headers - configurable headers for the request
 * @returns {Promise.<object, Error>} JSON response
 */
export function httpGetJson(hostname, port, path, headers = { Accept: 'application/json' }) {
  return new Promise((resolve, reject) => {
    const requestOptions = { hostname, port, path, method: 'GET', headers };

    /**
     * Generic handler for client http requests,
     * buffers response, checks status code and parses JSON
     * @param {Response} response - response object to be used for building the JSON response
     * @returns {undefined}
     */
    const requestHandler = (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error(`Non-2xx status code: ${response.statusCode}`));
        return;
      }

      const bodyChunks = [];
      response.on('data', (chunk) => bodyChunks.push(chunk));
      response.on('end', () => {
        try {
          const body = JSON.parse(bodyChunks.join(''));
          resolve(body);
        } catch {
          reject(new Error('Unable to parse JSON'));
        }
      });
    };

    const request = http.request(requestOptions, requestHandler);
    request.on('error', (err) => reject(err));
    request.end();
  });
}

/**
 * Util to get JSON data (parsed) from server via a HEAD HTTP request
 * @param {string} hostname - hostname of the server to where request will be made
 * @param {number} port - port of the server to where request will be made
 * @param {string} path - path of the server request to where request will be made
 * @param {JSON} headers - configurable headers for the request
 * @returns {Promise.<{status, headers}, Error>} - JSON response
 */
export function httpHeadJson(hostname, port, path, headers = { Accept: 'application/json' }) {
  const requestOptions = { hostname, port, path, method: 'HEAD', headers };
  return new Promise((resolve, reject) => {
    http.request(requestOptions, (res) => resolve({ status: res.statusCode, headers: res.headers }))
      .on('error', (err) => reject(err))
      .end();
  });
}
