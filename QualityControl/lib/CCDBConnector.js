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

const http = require('http');
const log = new (require('@aliceo2/web-ui').Log)('QualityControl');

/**
 * Gateway for all CCDB calls
 */
class CCDBConnector {
  /**
   * Setup and test CCDB connection
   * @param {Object} config - {hostname, port}
   */
  constructor(config) {
    if (!config) {
      throw new Error('[CCDBConnector] Empty CCDB config');
    }
    if (!config.hostname) {
      throw new Error('[CCDBConnector] Empty hostname in CCDB config');
    }
    if (!config.port) {
      throw new Error('[CCDBConnector] Empty port in CCDB config');
    }

    this.hostname = config.hostname;
    this.port = config.port;
    this.prefix = this.getPrefix(config);
    this.headers = {
      Accept: 'application/json',
      'X-Filter-Fields': 'path,createTime,lastModified'
    };
  }

  /**
   * Test connection to CCDB
   * @return {Promise.<Array.<String>, Error>}
   */
  async testConnection() {
    const connectionHeaders = {Accept: 'application/json', 'X-Filter-Fields': 'path', 'Browse-Limit': 1};
    return this.httpGetJson(`/browse/${this.prefix}`, connectionHeaders)
      .then(() => log.info('[CCDBConnector] Successfully connected to CCDB'))
      .catch((err) => {
        log.error('[CCDBConnector] Unable to connect to CCDB');
        log.trace(err);
        throw new Error(`[CCDBConnector] Unable to connect to CCDB due to: ${err}`);
      });
  }

  /**
   * List of all objects
   * @return {Promise.<Array.<Object>, Error>}
   */
  async listObjects() {
    return this.httpGetJson(`/latest/${this.prefix}.*`)
      .then((result) =>
        result.objects
          .filter(this.isItemValid)
          .map(this.itemTransform)
      );
  }

  /**
   * Retrieve a list of available timestamps for a specified object
   * @param {String} objectName - full path of the object
   */
  async getObjectTimestampList(objectName) {
    const timestampHeaders = {Accept: 'application/json', 'X-Filter-Fields': 'path,lastModified', 'Browse-Limit': 50};
    return this.httpGetJson(`/browse/${objectName}`, timestampHeaders)
      .then((result) =>
        result.objects
          .filter(this.isItemValid)
          .map((item) => parseInt(item.lastModified))
      );
  }

  /**
   * Util to get JSON data (parsed) from CCDB server
   * @param {string} path - path en CCDB server
   * @param {JSON} headers - use default initialized in constructor if not provided
   * @return {Promise.<Object, Error>} JSON response
   */
  httpGetJson(path, headers = this.headers) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.hostname,
        port: this.port,
        path: path,
        method: 'GET',
        headers: headers
      };

      /**
       * Generic handler for client http requests,
       * buffers response, checks status code and parses JSON
       * @param {Response} response
       */
      const requestHandler = (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('[CCDBConnector] Non-2xx status code: ' + response.statusCode));
          return;
        }

        const bodyChunks = [];
        response.on('data', (chunk) => bodyChunks.push(chunk));
        response.on('end', () => {
          try {
            const body = JSON.parse(bodyChunks.join(''));
            resolve(body);
          } catch (e) {
            reject(new Error('[CCDBConnector] Unable to parse JSON'));
          }
        });
      };

      const request = http.request(requestOptions, requestHandler);
      request.on('error', (err) => reject(err));
      request.end();
    });
  }

  /*
   * Helpers
   */

  /**
   * Transforms objects received from CCDB to a QCG normalized one
   * with additional verification of content
   * @param {Object} item - from CCDB
   * @return {Object} to QCG use
   */
  itemTransform(item) {
    return {name: item.path, createTime: parseInt(item.createTime), lastModified: parseInt(item.lastModified)};
  }

  /**
   * Check if received object's path from CCDB is valid
   * @param {JSON} item
   * @return {JSON}
   */
  isItemValid(item) {
    if (!item.path) {
      log.warn(`[CCDBConnector] CCDB returned an empty ROOT object path, ignoring`);
      return false;
    } else if (item.path.indexOf('/') === -1) {
      log.warn(`[CCDBConnector] CCDB returned an invalid ROOT object path "${item.path}", ignoring`);
      return false;
    } else {
      return true;
    }
  }

  /**
   * Get prefix from configuration file and parse it
   * or use as default empty prefix
   * @param {JSON} config
   * @return {string} - format `name`
   */
  getPrefix(config) {
    let prefix = '';
    if (config.prefix && config.prefix.trim() !== '') {
      prefix = config.prefix.substr(0, 1) === '/' ? config.prefix.substr(1, config.prefix.length) : config.prefix;
      prefix = prefix.substr(prefix.length - 1, 1) === '/' ? prefix.substr(0, prefix.length - 1) : prefix;
    }
    return prefix;
  }
}

module.exports = CCDBConnector;
