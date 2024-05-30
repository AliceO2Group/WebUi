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
   * @param {EnvironmentService} environmentService - service to be used to retrieve information on environments
   */
  constructor(ctrlService, environmentService) {
    this.ctrlService = ctrlService;
    this.cache = {};
    this.timeout = 9000;
    this.cacheEvictionTimeout = 5 * 60 * 1000;
    this.cacheEvictionLast = new Date();
    this._cacheRefreshRate = 6000;
    this.refreshInterval = setInterval(() => this.refresh(), this._cacheRefreshRate);
    this._environmentService = environmentService;
  }

  /**
   * Clears cache if connection with AliECS core is lost (after timeout)
   */
  evictCache() {
    if (new Date() - this.cacheEvictionLast > this.cacheEvictionTimeout) {
      this.cache = {};
      this.cacheEvictionLast = new Date();
      log.info('Cache evicted');
    }
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
  _cacheInSync(obj) {
    try {
      assert.deepStrictEqual(this.cache, obj);
    } catch (error) {
      return false;
    }
    return true;
  }

  /**
   * Refreshes the cache using Control Service
   */
  async refresh() {
    try {
      const deadline = Date.now() + this.timeout;
      const envs = await this.ctrlService.executeCommandNoResponse('GetEnvironments', {}, {deadline});

      for (let [index, currentEnv] of envs.environments.entries()) {
        try {
          const environment = await this._environmentService.getEnvironment(currentEnv.id);
          envs.environments[index] = environment;
          this._updateCache(envs);
        } catch (error) {
          console.error(error);
        }
      }
      this._updateCache(envs);
    } catch (error) {
      log.debug(error);
    }
    this.evictCache();
  }

  /**
   * Method to update cache if there are any changes
   * @param {Object{Environments}} - environments' data that is to be stored in cache
   * @return {void}
   */
  _updateCache(envs) {
    if (!this._cacheInSync(envs)) {
      this.cache = envs;
      this.webSocket?.broadcast(new WebSocketMessage().setCommand('environments').setPayload(this.cache));
      log.debug('Updated cache');
    }
    this.cacheEvictionLast = new Date();
  }
}
module.exports = EnvCache;
