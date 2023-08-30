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
const LOG_LEVEL = 99;
const LOG_FACILITY = 'cog/status-ctrl';

/**
 * Controller for dealing with all API requests on framework information such as:
 * - GUI information (status, host, port)
 * - AliECS information
 * - AliECS Integrated Services information
 * - AliECS Apricot
 * - Consul
 * - Grafana
 */
class StatusController {
  /**
   * Constructor for initializing controller of statuses
   * @param {StatusService} statusService - service to use to query status of different components
   */
  constructor(statusService) {
    this.log = new Log(`${process.env.npm_config_log_label ?? 'cog'}/framework`);

    /**
     * @type {StatusService}
     */
    this._statusService = statusService;
  }

  /**
   * API - GET endpoint for retrieving data about consul component
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {undefined}
   */
  async getConsulStatus(_, res) {
    try {
      const componentStatus = await this._statusService.getConsulAsComponent();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of CONSUL';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about consul component
   * @param {Request} _ - HTTP Request object
   * @param {Response} res - HTTP Response object
   * @returns {undefined}
   */
  async getGrafanaStatus(_, res) {
    try {
      const componentStatus = await this._statusService.getGrafanaAsComponent();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of GRAFANA';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about the notification system
   * @param {Request} _ - HTTP request object
   * @param {Response} res  - HTTP response object
   */
  async getNotificationSystemStatus(_, res) {
    try {
      const componentStatus = await this._statusService.getNotificationSystemAsComponent();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of NOTIFICATION SYSTEM';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about the AliECS GUI
   * @param {Request} _ - HTTP request object
   * @param {*} res - HTTP response object
   */
  async getGuiStatus(_, res) {
    try {
      res.status(200).json(this._statusService.getGuiStatus());
    } catch (error) {
      const message = 'Unable to retrieve status of AliECS GUI';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about AliECS CORE
   * @param {Request} _ - HTTP request object
   * @param {*} res - HTTP response object
   */
  async getAliECSStatus(_, res) {
    try {
      const componentStatus = await this._statusService.retrieveAliEcsCoreInfo();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of AliECS CORE';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about AliECS APRICOT
   * @param {Request} _ - HTTP request object
   * @param {*} res - HTTP response object
   */
  async getApricotStatus(_, res) {
    try {
      const componentStatus = await this._statusService.getApricotAsComponent();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of APRICOT';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving data about AliECS Integrated Services
   * @param {Request} _ - HTTP request object
   * @param {Response} res - HTTP response object
   */
  async getAliECSIntegratedServicesStatus(_, res) {
    try {
      const componentStatus = await this._statusService.retrieveAliECSIntegratedInfo();
      res.status(200).json(componentStatus);
    } catch (error) {
      const message = 'Unable to retrieve status of AliECS Integrated Services';
      this.log.errorMessage(message, {level: LOG_LEVEL, facility: LOG_FACILITY});
      res.status(502).json({message});
    }
  }

  /**
   * API - GET endpoint for retrieving information on system compatibility
   * @param {Request} _ - HTTP request object
   * @param {Response} res - HTTP response object
   */
  async getSystemCompatibility(_, res) {
    try {
      const systemCompatibility = await this._statusService.getCompatibilityStateAsComponent();
      res.status(200).json(systemCompatibility);
    } catch (error) {
      console.error(error);
      const message = 'Unable to retrieve FLP and PDP versions';
      res.status(502).json({message});
    }
  }
}

exports.StatusController = StatusController;
