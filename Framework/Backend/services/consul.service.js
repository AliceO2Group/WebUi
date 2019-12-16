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

const log = new (require('./../log/Log.js'))('Consul');
const http = require('http');

/**
 * Gateway for all Consul calls
 */
class ConsulService {
  /**
   * Setup Consul configuration
   * @param {string} hostname
   * @param {number} port
   */
  constructor(hostname, port) {
    if (!hostname) {
      throw new Error('Hostname passed in Consul configuration cannot be empty');
    }
    if (!port) {
      throw new Error('Port passed in Consul configuration cannot be empty');
    }
    this.hostname = hostname;
    this.port = port;
    this.kvPath = '/v1/kv';
    this.servicesPath = '/v1/agent/services';
  }


  /**
   * Method to extract the tags from a service list. This represents objects that are in online mode.
   * @param {JSON} services ??????????????????
   * @return {Array<JSON>} [{ name: tag1 }, { name: tag2 }]
   */
  getTagsFromServices(services) {
    const tags = [];
    for (const serviceName in services) {
      if (services[serviceName] && services[serviceName].Tags && services[serviceName].Tags.length > 0) {
        const tagsToBeAdded = services[serviceName].Tags;
        tagsToBeAdded.forEach((tag) => tags.push({name: tag}));
      }
    }
    return tags;
  }

  /**
   * HTTP API Calls
   */

  /**
   * Returns a promise with regards to the status of the consul leader
   * @return {Promise}
   */
  async getConsulLeaderStatus() {
    return this.httpGetJson('/v1/status/leader');
  }

  /**
   * Method to return a promise containing the services stored in Consul
   * @return {Promise.<Array.<Object>, Error>}
   */
  async getAllServices() {
    return this.httpGetJson(this.servicesPath);
  }

  /**
   * Method to return a promise containing the names of the objects in online mode
   * @return {Promise.<Array.<Object>, Error>}
   */
  async getAllKeys() {
    return this.httpGetJson(this.servicesPath);
  }

  /**
   * Util to get JSON data (parsed) from Consul server
   * @param {string} path - path en Consul server
   * @return {Promise.<Object, Error>} JSON response
   */
  async httpGetJson(path) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: this.hostname,
        port: this.port,
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
}

module.exports = ConsulService;
