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
const CoreUtils = require('./CoreUtils.js');
const {
  RUNTIME_COMPONENT: {COG},
  RUNTIME_KEY: {RUN_TYPE_TO_HOST_MAPPING}
} = require('../common/kvStore/runtime.enum.js');

/**
 * Handles AliECS create env requests
 */
class RequestHandler {

  /**
   * @param {object} ctrlService - Handle to Control service
   * @param {ApricotService} apricotService - service to use to interact with A.P.R.I.C.O.T
   */
  constructor(ctrlService, apricotService) {
    this.ctrlService = ctrlService;
    this._apricotService = apricotService;
    this.requestList = {};

    /**
     * @type {WorkflowService}
     */
    this._workflowService = undefined;
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

    const {selectedConfiguration} = req.body;
    if (selectedConfiguration) {
      // workaround for reloading configuration before deployment from global page
      try {
        const {variables} = await this._workflowService.retrieveWorkflowSavedConfiguration(selectedConfiguration);
        variables.hosts = req.body.vars.hosts;

        const {epn_enabled, odc_n_epns} = req.body.vars;
        if (epn_enabled === 'true') {
          variables.odc_n_epns = odc_n_epns;
        }
        req.body.vars = variables;
      } catch (error) {
        console.error(error);
      }
    }
    const deploymentRequestedAt = Date.now();
    let creationResponse = null;

    let hostsToIgnoreForRunType = [];
    try {
      const runType = CoreUtils.getRunType(req.body);
      const hostsToIgnoreString = await this._apricotService.getRuntimeEntryByComponent(COG, RUN_TYPE_TO_HOST_MAPPING);
      const hostsToIgnoreMap = JSON.parse(hostsToIgnoreString);
      if (Array.isArray(hostsToIgnoreMap[runType])) {
        hostsToIgnoreForRunType = hostsToIgnoreMap[runType]
      }
    } catch (error) {
      errorLogger(`Unable to identify FLPs to ignore due to: ${error}`);
    }
    try {
      const payload = CoreUtils.parseEnvironmentCreationPayload(req.body, hostsToIgnoreForRunType);
      creationResponse = await this.ctrlService.executeCommandNoResponse('NewEnvironment', payload);

      log.debug('Auto-removed request, ID: ' + index);
      delete this.requestList[index];
    } catch (error) {
      errorLogger('Request failed, ID: ' + index);
      errorLogger(error);
      this.requestList[index].failed = true;
      this.requestList[index].message = error.details;
      if (error.envId) {
        this.requestList[index].envId = error.envId;
      }
    }
    const id = creationResponse ? creationResponse.environment.id : '';
    log.debug(`NEW_ENVIRONMENT,${id},,${deploymentRequestedAt},${Date.now()}`);

    this.broadcast();
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
    this.webSocket?.broadcast(new WebSocketMessage().setCommand('requests').setPayload(
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

  /**
   * Getters & Setters
   */

  /**
   * Setter for updating workflowService to use
   * @param {WorkflowService} - service to be used for retrieving workflow configuration
   * @return {void}
   */
  set workflowService(service) {
    this._workflowService = service;
  }
}
module.exports = RequestHandler;
