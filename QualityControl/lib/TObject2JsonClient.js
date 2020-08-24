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

const tobject2json = require('../tobject2json.node');

/**
 * Connect to a TObject2Json server and send requests though TCP/IP
 * and receive responses asynchronously (multiplexing).
 */
class TObject2JsonClient {
  /**
   * Connects to remote TObject2Json server and listen to it
   * @param {string} connector - Connecter type: ccdb/mysql
   * @param {Object} config - {host, port}
   */
  constructor(connector, config) {
    if (connector == 'ccdb') {
      connector = 'CCDB';
    }
    if (connector == 'mysql') {
      connector = 'MySQL';
    }
    tobject2json.init(connector, config.hostname + ':' + config.port, '', '', '');
  }

  /**
   * Get JSON-encoded ROOT object using QualityControl/TObject2Json C++ module
   * @param {string} path - object's path (agentName/objectName)
   * @param {number} timestamp - object's timestamp
   * @return {Promise.<Object|null, string>} The root data, null is not found
   */
  retrieve(path, timestamp = 0) {
    if (!path || path.indexOf('/') === -1) {
      return Promise.reject(new Error('Path should contain a slash at least'));
    }
    if (typeof timestamp !== 'number') {
      return Promise.reject(new Error('Timestamp should be a number'));
    }

    return new Promise((resolve, fail) => {
      tobject2json.get(path, timestamp, (error, result) => {
        if (error) {
          fail(new Error('TObject2Json C++ module failed'));
        } else {
          let message;
          try {
            message = JSON.parse(result);
          } catch (e) {
            fail(new Error('JSON decoding failed'));
          }
          resolve(message);
        }
      });
    });
  }
}

module.exports = TObject2JsonClient;
