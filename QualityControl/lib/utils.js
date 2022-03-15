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

const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'qcg'}/utils`);
const http = require('http');

/**
 * Global HTTP error handler, sends status 500
 * @param {string} err - Message error
 * @param {Response} res - Response object to send to
 * @param {number} status - status code 4xx 5xx, 500 will print to debug
 */
function errorHandler(errToLog, errToSend, res, status = 500, facility = 'utils') {
  errorLogger(errToLog, facility);
  res.status(status).send({message: errToSend.message || errToSend});
}

/**
 * Global Error Logger for AliECS GUI
 * @param {Error} err 
 */
function errorLogger(err, facility = 'utils') {
  log.facility = `${process.env.npm_config_log_label ?? 'qcg'}/${facility}`;
  if (err.stack) {
    log.trace(err);
  }
  log.error(err.message || err);
}

/**
  * Util to get JSON data (parsed) from server
  * @param {string} host - hostname of the server
  * @param {number} port - port of the server
  * @param {string} path - path of the server request
  * @return {Promise.<Object, Error>} JSON response
  */
function httpGetJson(host, port, path) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    };
    /**
     * Generic handler for client http requests,
     * buffers response, checks status code and parses JSON
     * @param {Response} response
     */
    const requestHandler = (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
        reject(new Error('Non-2xx status code: ' + response.statusCode));
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

    const request = http.request(requestOptions, requestHandler);
    request.on('error', (err) => reject(err));
    request.end();
  });
}

/**
 * Make a HEAD HTTP call and return a promise
 * @returns {Promise.<{status, headers}, Error>}
 */
function httpHeadJson(hostname, port, path, headers = {Accept: 'application/json'}) {
  const requestOptions = {hostname, port, path, method: 'HEAD', headers};
  return new Promise((resolve, reject) => {
    http.request(requestOptions, (res) => resolve({status: res.statusCode, headers: res.headers}))
      .on('error', (err) => reject(err))
      .end();
  });
}

module.exports = {errorHandler, errorLogger, httpGetJson, httpHeadJson};
