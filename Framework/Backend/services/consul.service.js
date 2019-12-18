/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const http = require('http');

/**
 * Gateway for all Consul calls
 */
class ConsulService {
  /**
   * Setup Consul configuration
   * @param {JSON} config
   */
  constructor(config) {
    if (!config) {
      throw new Error('Configuration field cannot be empty');
    }
    if (!config.hostname) {
      throw new Error('Hostname field cannot be empty');
    }
    if (!config.port) {
      throw new Error('Port field cannot be empty');
    }
    this.hostname = config.hostname;
    this.port = config.port;

    this.servicesPath = '/v1/agent/services';
    this.kvPath = '/v1/kv/';
    this.leaderPath = '/v1/status/leader';
  }

  /**
   * Returns a promise with regards to the status of the consul leader
   * @return {Promise}
   */
  async getConsulLeaderStatus() {
    return this.httpGetJson(this.leaderPath);
  }

  /**
   * Method to return a promise containing all services stored in Consul
   * * a JSON of Objects representing all services with their metadata
   * * an error if request was not successful
   * @return {Promise}
   */
  async getServices() {
    return this.httpGetJson(this.servicesPath);
  }

  /**
   * Method to return a Promise containing:
   * * an array of strings representing all keys in Consul store if request is successful
   * @return {Promise.<Array<string>, Error>}
   */
  async getKeys() {
    return this.httpGetJson(this.kvPath + '?keys=true');
  }

  /**
   * Method to return a Promise containing:
   * * an array of strings representing all keys that starts with the provided `keyPrefix`
   * @param {string} keyPrefix - containing the prefix of the keys requested
   * @return {Promise.<Array<string>, Error>}
   */
  async getKeysByPrefix(keyPrefix) {
    keyPrefix = this.parseKey(keyPrefix);
    const getPath = this.kvPath + keyPrefix + '/?keys=true';
    return this.httpGetJson(getPath);
  }

  /**
   * Method to return a Promise containing:
   * * a JSON object containing the Value and metadata stored for the specified key; If key is not found 404 is returned
   * @param {string} key
   * @return {Promise.<JSON, Error>}
   */
  async getValueObjectByKey(key) {
    key = this.parseKey(key);
    const getPath = this.kvPath + key;
    return this.httpGetJson(getPath);
  }

  /**
   * Method to return a Promise containing:
   * * the raw value stored for the requested key; If key is not found 404 is returned
   * @param {string} key
   * @return {Promise.<string, Error>}
   */
  async getOnlyRawValueByKey(key) {
    key = this.parseKey(key);
    const getPath = this.kvPath + key + '?raw=true';
    return this.httpGetJson(getPath);
  }

  /**
   * Method to return a Promise containing:
   * * * an `Array<JSON>` containing the value and metadata stored for the objects with the requested keyPrefix;
   * @param {string} keyPrefix
   * @return {Promise.<Array<JSON>, Error>}
   */
  async getValuesByKeyPrefix(keyPrefix) {
    keyPrefix = this.parseKey(keyPrefix);
    const getPath = this.kvPath + keyPrefix + '?recurse=true';
    return this.httpGetJson(getPath);
  }

  /**
   * Method to return a Promise containing:
   * * * an `Array<string>` containing the raw value stored for the objects with the requested keyPrefix;
   * * an error if request was not successful
   * @param {string} keyPrefix
   * @return {Promise.<Array<string>, Error>}
   */
  async getOnlyRawValuesByKeyPrefix(keyPrefix) {
    keyPrefix = this.parseKey(keyPrefix);
    const getPath = this.kvPath + keyPrefix + '?recurse=true';
    return this.httpGetJson(getPath).then((data) => {
      return data.map((object) => object.Value)
        .filter((value) => value !== undefined)
        .map((value) => Buffer.from(value, 'base64').toString('ascii'));
    });
  }


  /**
   * Util to get JSON data (parsed) from Consul server
   * @param {string} path - path to Consul server
   * @return {Promise.<Object, Error>} JSON response
   */
  async httpGetJson(path) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.hostname,
        port: this.port,
        path: path,
        qs: {keys: true},
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
   * Helpers
   */

  /**
   * Method to check for and remove any `/` from the start and end of a key/keyPrefix
   * @param {string} key - key or keyPrefix to check
   * @return {string}
   */
  parseKey(key) {
    if (key.charAt(0) === '/') {
      key = key.substring(1);
    }
    if (key.charAt(key.length - 1) === '/') {
      key = key.substring(0, key.length - 1);
    }
    return key;
  }
}

module.exports = ConsulService;
