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
const log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/controlrequests`);
const {errorLogger} = require('./../utils.js');

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
   *  Sets WebSocket instance
   *  @param {object} ws
   */
  setWs(ws) {
    this.webSocket = ws;
  }

  /**
   * Add AliECS request list to "cache", remove it from the "cache" once response comes from AliECS
   * @param {Request} req
   * @param {Response} res
   */
  async add(req, res) {
    const index = parseInt(Object.keys(this.requestList).pop()) + 1 || 0;
    this.requestList[index] = {
      id: index,
      detectors: req.body.detectors,
      workflow: req.body.workflowTemplate,
      date: new Date(),
      owner: req.session.name,
      personid: req.session.personid,
      failed: false
    };
    res.json({ok: 1});
    this.broadcast();
    log.debug('Added request to cache, ID: ' + index);

    try {
      await this.ctrlService.executeCommandNoResponse('NewEnvironment', req.body);
      log.debug('Auto-removed request, ID: ' + index);
      delete this.requestList[index];
      this.broadcast();
    } catch(error) {
      errorLogger('Request failed, ID: ' + index);
      this.requestList[index].failed = true;
      this.requestList[index].message = error.details;
    }
  }

  /**
   * Remove request from "cache".
   * @param {Request} req
   * @param {Response} res
   * @returns {Object}
   */
  remove(req, res) {
    const index = req.params.id;
    log.debug('User removed request, ID: ' + index);
    delete this.requestList[index];
    return this.getAll(req, res);
  }

  /**
   * Broadcast list of request
   */
  broadcast() {
    this.webSocket.broadcast(new WebSocketMessage().setCommand('requests').setPayload(
      this._getAll()
    ));
  }

  /**
   * @returns {Object} Returns request as array and current date
   */
  _getAll() {
    return {
      now: new Date(),
      requests: Object.values(this.requestList)
    }
  }

  /**
   * Get all the requests from the "cache"
   * @param {Request} req
   * @param {Response} res
   * @returns {Object}
   */
  getAll(req, res) {
    return res.json(this._getAll());
  }
}
module.exports = RequestHandler;
