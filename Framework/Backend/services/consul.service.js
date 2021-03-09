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
      throw new Error('[Consul] Configuration field cannot be empty');
    }
    if (!config.hostname) {
      throw new Error('[Consul] Hostname field cannot be empty');
    }
    if (!config.port) {
      throw new Error('[Consul] Port field cannot be empty');
    }
    this.hostname = config.hostname;
    this.port = config.port;

    this.servicesPath = '/v1/agent/services';
    this.kvPath = '/v1/kv/';
    this.leaderPath = '/v1/status/leader';
    this.txnPath = '/v1/txn';
  }

  /**
   * Returns a promise with regards to the status of the consul leader
   * @return {Promise}
   */
  async getConsulLeaderStatus() {
    return this.httpJson(this.leaderPath);
  }

  /**
   * Method to return a promise containing all services stored in Consul
   * * a JSON of Objects representing all services with their metadata
   * * an error if request was not successful
   * @return {Promise}
   */
  async getServices() {
    return this.httpJson(this.servicesPath);
  }

  /**
   * Method to return a Promise containing:
   * * an array of strings representing all keys in Consul store if request is successful
   * @return {Promise.<Array<string>, Error>}
   */
  async getKeys() {
    return this.httpJson(this.kvPath + '?keys=true');
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
    return this.httpJson(getPath);
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
    return this.httpJson(getPath);
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
    return this.httpJson(getPath);
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
    return this.httpJson(getPath);
  }

  /**
   * Method to return a Promise containing:
   * * * an `Array<string>` containing the raw value stored for the objects with the requested keyPrefix;
   * * an error if request was not successful
   * @param {string} keyPrefix
   * @return {Promise.<KV<string, string>, Error>}
   */
  async getOnlyRawValuesByKeyPrefix(keyPrefix) {
    keyPrefix = this.parseKey(keyPrefix);
    const getPath = this.kvPath + keyPrefix + '?recurse=true';
    return this.httpJson(getPath).then((data) => {
      const response = {};
      data.forEach((object) => {
        const key = object.Key;
        response[key] = undefined;
        if (object.Value) {
          const valueDecoded = Buffer.from(object.Value, 'base64').toString('ascii');
          response[key] = valueDecoded;
        }
      });
      return response;
    });
  }

  /**
   * Given a list of KV Pairs, split it in batches of maximum 64 pairs
   * and use transactions to update or set new keys in Consul KV Store
   * Will return Promise.Resolve() with ok if all transaction was done
   * or false if at least one failed
   * @param {Array<KV>} list
   * @return {Promise.<JSON, Error>}
   */
  async putListOfKeyValues(list) {
    const consulBuiltList = this._mapToConsulKVObjectsLists(list);
    let allPut = true;
    await Promise.all(consulBuiltList.map(async (list) => {
      try {
        const requestOptions = this._getRequestOptionsPUT(this.txnPath, list);
        await this.httpJson(this.txnPath, requestOptions, list);
      } catch (error) {
        allPut = false;
      }
    }));
    return {allPut: allPut};
  }

  /**
   * Util to get/put JSON data (parsed) from Consul server
   * @param {string} path - path to Consul server
   * @param {JSON} requestOptions
   * @param {JSON} data
   * @return {Promise.<Object, Error>} JSON response
   */
  async httpJson(path, requestOptions, data) {
    return new Promise((resolve, reject) => {
      const reqOptions = requestOptions ? requestOptions : {
        hostname: this.hostname,
        port: this.port,
        path: path,
        qs: {keys: true},
        method: 'GET',
        headers: {Accept: 'application/json'}
      };

      /**
       * Generic handler for client http requests,
       * buffers response, checks status code and parses JSON
       * @param {Response} response
       * @return {Promise.<JSON, Error>}
       */
      const requestHandler = (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          reject(new Error('Non-2xx status code: ' + response.statusCode));
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
      }

      const request = http.request(reqOptions, requestHandler);
      request.on('error', (err) => reject(err));
      if (reqOptions.method === 'PUT' && data) {
        request.write(JSON.stringify(data));
      }
      request.end();
    });
  }

  /**
   * Helpers
   */

  /**
   * Build a JSON with request options needed for PUT request
   * @param {JSON} data 
   * @return {JSON}
   */
  _getRequestOptionsPUT(path, data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    return {
      hostname: this.hostname,
      port: this.port,
      path: path,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
  }

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

  /**
   * Given a list of KV pairs, for each pair build  a consul transaction object.
   * These pairs will than be placed in batches due to the fact that a transaction
   * accepts maximum 64 elements
   * https://www.consul.io/api/txn
   * @param {Array<<String,String>>} list 
   * @return {Array<Array<ConsulTransaction>>}
   */
  _mapToConsulKVObjectsLists(list) {
    const consulList = [];
    let transactionList = [];
    list.forEach((kvPair) => {
      const key = Object.keys(kvPair)[0];
      const consulObj = {
        KV: {
          Verb: 'set',
          Key: key,
          Value: Buffer.from(kvPair[key]).toString('base64')
        }
      };
      transactionList.push(consulObj);
      if (transactionList.length >= 64) {
        consulList.push(transactionList);
        transactionList = [];
      }
    });
    if (transactionList.length !== 0) {
      consulList.push(transactionList);
    }
    return consulList;
  }
}

module.exports = ConsulService;
