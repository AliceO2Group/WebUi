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

const { LogManager } = require('@aliceo2/web-ui');

/**
 * Gateway for all calls with regards to the status
 * of the framework and its dependencies
 */
class StatusController {
  /**
   * Setup StatusController for the application which is to provide status of used services
   * @param {object} config - of the framework
   * @param {object} projPackage - package json file
   * @param {WebSocket} webSocketServer - instance of the web socket server used by the application
   */
  constructor(config, projPackage, webSocketServer) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/status`);

    this._config = config;
    this._projPackage = projPackage;

    /**
     * @type {WebSocket}
     */
    this._ws = webSocketServer;
  }

  /**
   * Set source of data once enabled
   * @param {SQLDataSource} querySource - source of data
   */
  set querySource(querySource) {
    this._querySource = querySource;
  }

  /**
   * Set source of live mode once enabled
   * @param {InfoLoggerReceiver} liveSource - source of live mode
   */
  set liveSource(liveSource) {
    this._liveSource = liveSource;
  }

  /**
   * Method which handles the request for returning infologger gui information and status of it
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   */
  async getILGStatus(_, res) {
    let result = {
      version: this?._projPackage?.version ?? 'unknown',
    };
    if (this._config.http) {
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
    const { infoLoggerServer: ilgServerConfig, mysql: dataSourceConfig } = this._config;
    const result = {
      'infoLogger-gui': this._getProjectInfo(),
      infoLoggerServer: this._getLiveSourceStatus(ilgServerConfig ?? {}),
      mysql: this._getDataSourceStatus(dataSourceConfig ?? {}),
    };

    res.status(200).json(result);
  }

  /**
   * Build an object containing InfoLogger GUI's information
   * @returns {object} - information about the application
   */
  _getProjectInfo() {
    let info = {
      version: this?._projPackage?.version ?? 'unknown',
    };
    if (this._config.http) {
      const { http } = this._config;
      const ilg = { hostname: http.hostname, port: http.port, status: { ok: true }, name: http.name ?? '' };
      info = Object.assign(info, ilg);
    }
    info.clients = this._ws?.server?.clients?.size ?? -1;
    return info;
  }

  /**
   * Build an object with information and status about live source
   * @param {object} config used for retrieving data from live source
   * @param {string} config.host - host of the live source
   * @param {number} config.port - port of the live source
   * @returns {object} - information on status of the live source
   */
  _getLiveSourceStatus({ host, port }) {
    return {
      host,
      port,
      status: this?._liveSource?.isAvailable
        ? { ok: true }
        : { ok: false, message: 'Unable to connect to InfoLogger Server' },
    };
  }

  /**
   * Build object with information and latest known status about data source
   * @param {object} config used for retrieving data form data source
   * @param {string} config.host - host of the data source
   * @param {number} config.port - port of the data source
   * @param {string} config.database - database name
   * @returns {object} - information on statue of the data source
   */
  _getDataSourceStatus({ host, port, database }) {
    return {
      host,
      port,
      database,
      status: this?._querySource?.isAvailable
        ? { ok: true }
        : { ok: false, message: 'Data source is not available' },
    };
  }
}

module.exports.StatusController = StatusController;
