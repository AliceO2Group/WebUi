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

const logger = new (require('@aliceo2/web-ui').LogManager)
  .getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/status`);

/**
 * Gateway for all calls with regards to the status
 * of the framework and its dependencies
 */
class StatusService {
  /**
   * Setup StatusService
   * @param {JSON} config - of the framework
   * @param {JSON} projPackage - package json file
   * @param {WebSocket} webSocketServer - instance of the web socket server used by the application
   */
  constructor(config, projPackage, webSocketServer) {
    if (!config) {
      throw new Error('Empty Framework configuration');
    }
    this.config = config;
    this.projPackage = projPackage;

    /**
     * @type {WebSocket}
     */
    this._ws = webSocketServer;
  }

  /**
   * Set source of data once enabled
   * @param {SQLDataSource} querySource - source of data
   */
  setQuerySource(querySource) {
    this.querySource = querySource;
  }

  /**
   * Set source of live mode once enabled
   * @param {InfoLoggerReceiver} liveSource - source of live mode
   */
  setLiveSource(liveSource) {
    this.liveSource = liveSource;
  }

  /**
   * Method which handles the request for returning infologger gui information and status of it
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   */
  async getILGStatus(_, res) {
    let result = {};
    if (this.projPackage && this.projPackage.version) {
      result.version = this.projPackage.version;
    }
    if (this.config.http) {
      const ilg = { status: { ok: true } };
      result = Object.assign(result, ilg);
    }
    result.clients = this._ws?.server?.clients?.size ?? -1;
    res.status(200).json(result);
  }

  /**
   * Method which handles the request for returning
   * framework information and status of its components
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   */
  async frameworkInfo(_, res) {
    const result = {};
    result['infoLogger-gui'] = this.getProjectInfo();

    if (this.config.infoLoggerServer) {
      result.infoLoggerServer = this.getLiveSourceStatus(this.config.infoLoggerServer);
    }
    if (this.config.mysql) {
      result.mysql = await this.getDataSourceStatus(this.config.mysql);
    }
    res.status(200).json(result);
  }

  /**
   * Build an object containing InfoLogger GUI's information
   * @returns {object} - information about the application
   */
  getProjectInfo() {
    let info = {};
    if (this.projPackage && this.projPackage.version) {
      info.version = this.projPackage.version;
    }
    if (this.config.http) {
      const { http } = this.config;
      const ilg = { hostname: http.hostname, port: http.port, status: { ok: true }, name: http.name ?? '' };
      info = Object.assign(info, ilg);
    }
    info.clients = this._ws?.server?.clients?.size ?? -1;
    return info;
  }

  /**
   * Build an object with information and status about live source
   * @param {object} config used for retrieving data from live source
   * @returns {object} - information on status of the live source
   */
  getLiveSourceStatus(config) {
    const ils = { host: config.host, port: config.port };
    ils.status = this.liveSource && this.liveSource.isConnected ?
      { ok: true }
      : { ok: false, message: 'Unable to connect to InfoLogger Server' };
    return ils;
  }

  /**
   * Build object with information and status about data source
   * @param {object} config used for retrieving data form data source
   * @returns {object} - information on statue of the data source
   */
  async getDataSourceStatus(config) {
    const mysql = {
      host: config.host,
      port: config.port,
      database: config.database,
    };
    if (this.querySource) {
      try {
        await this.querySource.isConnectionUpAndRunning();
        mysql.status = { ok: true };
      } catch (error) {
        logger.error(error.message || error);
        if (error.stack) {
          logger.trace(error);
        }
        mysql.status = { ok: false, message: error.message || error };
      }
    } else {
      logger.error('There was no data source set up');
      mysql.status = { ok: false, message: 'There was no data source set up' };
    }
    return mysql;
  }
}

module.exports = StatusService;
