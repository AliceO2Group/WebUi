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
    this.refreshInterval = setInterval(() => this.refresh(), 1000);
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
   * Refreshes the cache using Control Service
   */
  async refresh() {
    try {
      this.cache = await this.ctrlService.executeCommandNoResponse('GetEnvironments');
    } catch(error) {
      this.cache = {};
    }
  }
}
module.exports = EnvCache;
