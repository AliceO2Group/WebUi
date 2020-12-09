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

const log = new (require('@aliceo2/web-ui').Log)('QCG-StatusService');

/**
 * Gateway for all calls with regards to the status
 * of the framework and its dependencies
 */
class StatusService {
  /**
   * Setup StatusService
   * @param {JSON} config - of the framework
   * @param {JSON} projPackage - package json file
   */
  constructor(config, projPackage) {
    if (!config) {
      throw new Error('Empty Framework configuration');
    }
    this.config = config;
    this.projPackage = projPackage;
  }

  /**
   * Set connector that is used for retrieving general information
   * about objects (e.g. CCDB)
   * @param {Object} connector 
   */
  setDataConnector(connector) {
    this.connector = connector;
  }

  /**
   * Set connector used for live mode for retrieving paths
   * of objects (e.g. Consul)
   * @param {Object} liveConnector 
   */
  setLiveModeConnector(liveConnector) {
    this.liveConnector = liveConnector;
  }

  /**
   * Send back information and status about the framework and its dependencies
   * @param {Request} req
   * @param {Response} res
   */
  async frameworkInfo(req, res) {
    try {
      const info = await this.getFrameworkInfo();
      res.status(200).json(info)
    } catch (error) {
      this.logError(error);
      res.status(502).json({message: error.message | error});
    }
  }

  /**
   * Send back info about the framework
   */
  async getFrameworkInfo() {
    const result = {};
    result.qcg = {};
    if (this.projPackage && this.projPackage.version) {
      result.qcg.version = this.projPackage.version;
    }
    if (this.config.http) {
      const qc = {hostname: this.config.http.hostname, port: this.config.http.port};
      result.qcg = Object.assign(result.qcg, qc);
      result.qcg.status = {ok: true}
    }
    if (this.config.ccdb) {
      result.ccdb = this.config.ccdb;
      result.ccdb.status = await this.getDataConnectorStatus();
    }
    if (this.config.consul) {
      result.consul = this.config.consul;
      result.consul.status = await this.getLiveModeConnectorStatus();
    }
    if (this.config.quality_control) {
      result.quality_control = this.config.quality_control;
    }
    return result;
  }

  /**
   * Retrieve Data Connector status
   * @return {Promise<Resolve, Reject>}
   */
  async getDataConnectorStatus() {
    if (!this.connector) {
      return {ok: false, message: 'Data connector was not configured'}
    } 
    try {
      await this.connector.testConnection();
      return {ok: true};
    } catch (err) {
      this.logError(err);
      return {ok: false, message: err.message || err};
    }
  }

  /**
   * Retrieve Live Connector status
   * @return {Promise<Resolve, Reject>}
   */
  async getLiveModeConnectorStatus() {
    if (!this.liveConnector) {
      return {ok: false, message: 'Live Mode was not configured'}
    }
    try {
      await this.liveConnector.getConsulLeaderStatus();
      return {ok: true};
    } catch (err) {
      this.logError(err);
      return {ok: false, message: err.message || err};
    }
  }

  /**
   * Log the error based on containing a stack trace or not
   * @param {Error} err 
   */
  logError(err) {
    log.error(err.message || err)
    if (err.stack) {
      log.trace(err);
    }
  }
}

module.exports = StatusService;
