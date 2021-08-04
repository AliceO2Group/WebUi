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

const log = new (require('@aliceo2/web-ui').Log)(`${process.env.npm_config_log_label ?? 'ilg'}/status`);

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
   * Set source of data once enabled
   * @param {SQLDataSource} querySource 
   */
  setQuerySource(querySource) {
    this.querySource = querySource;
  }

  /**
   * Set source of live mode once enabled
   * @param {InfoLoggerReceiver} liveSource
   */
  setLiveSource(liveSource) {
    this.liveSource = liveSource;
  }

  /**
   * Method which handles the request for returning 
   * framework information and status of its components
   * @param {Request} req
   * @param {Response} res
   */
  async frameworkInfo(req, res) {
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
   * Build a JSON containing InfoLogger GUI's information
   * @return {JSON}
   */
  getProjectInfo() {
    let info = {}
    if (this.projPackage && this.projPackage.version) {
      info.version = this.projPackage.version;
    }
    if (this.config.http) {
      const ilg = {hostname: this.config.http.hostname, port: this.config.http.port, status: {ok: true}};
      info = Object.assign(info, ilg);
    }
    return info;
  }

  /**
   * Build JSON with information and status about live source
   * @param {JSON} config used for retrieving data from live source
   * @return {JSON}
   */
  getLiveSourceStatus(config) {
    const ils = {host: config.host, port: config.port};
    ils.status = this.liveSource && this.liveSource.isConnected ?
      {ok: true}
      : {ok: false, message: 'Unable to connect to InfoLogger Server'}
    return ils;
  }

  /**
   * Build JSON with information and status about data source
   * @param {JSON} config used for retrieving data form data source
   * @return {JSON}
   */
  async getDataSourceStatus(config) {
    const mysql = {
      host: config.host,
      port: config.port,
      database: config.database,
    }
    if (this.querySource) {
      try {
        await this.querySource.isConnectionUpAndRunning();
        mysql.status = {ok: true};
      } catch (error) {
        log.error(error.message || error);
        if (error.stack) {
          log.trace(error);
        }
        mysql.status = {ok: false, message: error.message || error};
      }
    } else {
      log.error('There was no data source set up')
      mysql.status = {ok: false, message: 'There was no data source set up'}
    }
    return mysql;
  }
}

module.exports = StatusService;
