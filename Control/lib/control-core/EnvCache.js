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

const {WebSocketMessage, Log} = require('@aliceo2/web-ui');
const log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/envcache`);
const assert = require('assert');

/**
 * Caches AliECS core GetEnvironments response
 */
class EnvCache {

  /**
   * @param {object} ctrlService - Handle to Control service
   */
  constructor(ctrlService) {
    this.ctrlService = ctrlService;
    this.cache = {};
    this.timeout = 1500;
    this.refreshInterval = setInterval(() => this.refresh(), this.timeout);
  }

  /**
   *  Sets WebSocket instance
   *  @param {object} ws
   */
  setWs(ws) {
    this.webSocket = ws;
  }

  /**
   * Returns cached response
   * @param {Request} req
   * @param {Response} res
   */
  get(req, res) {
    return res.send(this.cache);
  }

  /**
   * @param {Object} obj Object to compare cache with
   * @return {bool} Whether object and cache are deep equal
   */
  _cacheExpired(obj) {
    try {
      assert.deepStrictEqual(this.cache, obj);
    } catch(error) {
      return false;
    }
    return true;
  }

  /**
   * Refreshes the cache using Control Service
   */
  async refresh() {
    try {
      const envs = await Promise.race([
        this.ctrlService.executeCommandNoResponse('GetEnvironments'),
        new Promise((_, reject) => {setTimeout(() => reject(new Error('GetEnvironments timed out')), this.timeout)})
      ]);
      if (!this._cacheExpired(envs)) {
        this.cache = envs;
        this.webSocket?.broadcast(new WebSocketMessage().setCommand('environments').setPayload(this.cache));
        log.debug('Updated cache');
      }
    } catch(error) {
      log.debug(error);
    }
  }
}
module.exports = EnvCache;
