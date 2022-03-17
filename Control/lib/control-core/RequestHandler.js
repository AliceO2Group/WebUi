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

const {Log} = require('@aliceo2/web-ui');
const log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/controlrequests`);
const {errorHandler} = require('./../utils.js');

/**
 * Handles AliECS create env requests
 */
class RequestHandler {

  /**
   * @param {object} ctrlService - Handle to Control service
   */
  constructor(ctrlService) {
    this.ctrlService = ctrlService;
    this.requestList = {};
  }

  /**
   * Add AliECS request list to "cache", remove it from the "cache" once response comes from AliECS
   * @param {object} req
   * @param {object} res
   */
  async add(req, res) {
    const index = Object.keys(this.requestList).length;
    this.requestList[index] = { 
      detectors: req.body.detectors,
      workflow: req.body.workflowTemplate,
      date: new Date(),
      owner: req.session.name
    };
    res.json({ok: 1});
    log.debug('Added request to cache, ID: ' + index);
    try {
      await this.ctrlService.executeCommandNoResponse('NewEnvironment', req.body);
      log.debug('Removed request from the cache, ID: ' + index);
    } catch(error) {
      errorHandler(error, res, 504);
    }
    delete this.requestList[index];
  }

  /**
   * Get all the requests from the "cache"
   * @param {object} req
   *  @param {object} res
   */
  getAll(req, res) {
    res.json({
      now: new Date(),
      requests: Object.values(this.requestList)
    });
  }
}
module.exports = RequestHandler;
