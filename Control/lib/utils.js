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

const logger = new (require('@aliceo2/web-ui').LogManager)
  .getLogger(`${process.env.npm_config_log_label ?? 'cog'}/utils`);
const http = require('http');
const https = require('https');

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(err, res, status = 500, facility = 'utils') {
  errorLogger(err, facility);
  res.status(status);
  res.send({message: err.message || err});
}

/**
 * Global Error Logger for AliECS GUI
 * @param {Error} err
 */
function errorLogger(err, facility = 'utils') {
  logger.facility = `${process.env.npm_config_log_label ?? 'cog'}/${facility}`;
  if (err.stack) {
    logger.trace(err);
  }
  logger.error(err.message || err);
}

/**
  * Util to get JSON data (parsed) following a GET request
  * @param {string} host - hostname of the server
  * @param {number} port - port of the server
  * @param {string} path - path of the server request
  * @param {JSON} options - specific request options (e.g range of accepted status code)
  * @return {Promise.<Object, Error>} JSON response
  */
function httpGetJson(hostname, port, path, options = undefined) {
  options = {
    statusCodeMin: 200,
    statusCodeMax: 299,
    rejectMessage: 'Non-2xx status code: ',
    protocol: 'http:',
    rejectUnauthorized: true,
    ...options ?? {}
  };
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname,
      port,
      path,
      method: 'GET',
      rejectUnauthorized: Boolean(options.rejectUnauthorized),
      headers: {
        Accept: 'application/json'
      }
    };
    /**
     * Generic handler for GET HTTP requests, buffers response, checks status code and parses JSON
     * @param {Response} response
     */
    const requestHandler = (response) => {
      if (response.statusCode < options.statusCodeMin || response.statusCode > options.statusCodeMax) {
        reject(new Error(options.rejectMessage + response.statusCode));
        return;
      }

      const bodyChunks = [];
      response.on('data', (chunk) => bodyChunks.push(chunk));
      response.on('end', () => {
        try {
          const body = JSON.parse(bodyChunks.join(''));
          resolve(body);
        } catch (e) {
          reject(new Error('Unable to parse JSON'));
        }
      });
    };
    let request;
    if (options.protocol === 'https:') {
      request = https.request(requestOptions, requestHandler);
    } else {
      request = http.request(requestOptions, requestHandler);
    }
    request.on('error', (err) => reject(err));
    request.end();
  });
}


module.exports = {errorHandler, errorLogger, httpGetJson};
