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

const http = require('http');
const url = require('url');
const projPackage = require('../../package.json');

/**
 * Gateway for all Status Consumer calls
 */
class StatusService {

  /**
   * Setup StatusService
   * @param {JSON} config - server configuration
   * @param {ControlService} ctrlService
   * @param {ConsulService} consulService
   */
  constructor(config, ctrlService, consulService, apricotService) {
    this.config = config;
    this.ctrlService = ctrlService
    this.consulService = consulService;
    this.apricotService = apricotService;
    this.NOT_CONFIGURED = 'This service was not configured';
  }


  /**
   * Verified that HTTP request returns status code with accepted range
   * @param {string} host - hostname of the server
   * @param {number} port - port of the server
   * @param {string} path - path of the server request
   * @return {Promise.<Object, Error>} Resolves if status code is correct
   */
  async httpCheckStatusCode(host, port, path) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        hostname: host,
        port: port,
        path: path,
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      };
      const request = http.request(requestOptions, (response) => {
        if (response.statusCode < 200 || response.statusCode > 301) {
          reject(new Error('Invalid status code: ' + response.statusCode));
        }
        resolve();
      });
      request.on('error', (err) => reject(err));
      request.end();
    });
  }


  /**
   * Build a response containing the information and status of the Consul Service
   * @return {Promise<Resolve>}
   */
  async getConsulStatus() {
    let consulStatus = {};
    if (this.config?.consul) {
      consulStatus = this.config.consul;
      try {
        await this.consulService.getConsulLeaderStatus();
        consulStatus.status = {ok: true, configured: true};
      } catch (error) {
        consulStatus.status = {ok: false, configured: true, message: error.toString()};
      }
    } else {
      consulStatus.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return consulStatus;
  }

  /**
   * Build a response containing the information and status of the AliECS Core
   * @return {Promise<Resolve>}
   */
  async getAliEcsCoreStatus() {
    let aliEcs = {};
    if (this.config?.grpc) {
      aliEcs = {
        url: `${this.config.grpc.hostname}:${this.config.grpc.port}`,
        timeout: this.config.grpc.timeout,
        maxMessageLength: this.config.grpc.maxMessageLength,
      };
      try {
        const coreInfo = await this.ctrlService.getAliECSInfo();
        aliEcs = Object.assign({}, aliEcs, coreInfo);
        aliEcs.status = {ok: true, configured: true};
      } catch (error) {
        aliEcs.status = {ok: false, configured: true, message: error.toString()};
      }
    } else {
      aliEcs.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return aliEcs;
  }

  /**
   * Build a response containing the information and status of the integrated services
   * If core responds successfully than each service will be added to a Map with its name as the key
   * Otherwise, an entry with label 'Integrated Services' will be added in the response
   * @returns {Promise<Resolve>}
   */
  async getIntegratedServicesInfo() {
    let integServices = {};
    try {
      const {services} = await this.ctrlService.getIntegratedServicesInfo();
      return services;
    } catch (error) {
      integServices.all = {
        name: 'Integrated Services',
        connectionState: 'TRANSIENT_FAILURE',
        data: {message: error.toString()}
      };
      return integServices;
    }
  }

  /**
   * Build a response containing the information and status of Apricot Service
   * @returns {Promise<Resolve>}
   */
  async getApricotStatus() {
    let apricot = {};
    if (this.config?.apricot) {
      apricot = {
        url: `${this.config.apricot.hostname}:${this.config.apricot.port}`,
        timeout: this.config.apricot.timeout,
        maxMessageLength: this.config.apricot.maxMessageLength
      };
      try {
        await this.apricotService.getStatus();
        apricot.status = {ok: true, configured: true};
      } catch (error) {
        apricot.status = {ok: false, configured: true, message: error.toString()}
      }

    } else {
      apricot.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return apricot;
  }

  /**
   * Build a response containing the information and status of the Grafana Service
   * @return {Promise<Resolve>}
   */
  async getGrafanaStatus() {
    let grafana = {};
    if (this.config?.grafana?.url) {
      try {
        const urlObject = url.parse(this.config.grafana.url);
        grafana = {url: this.config.grafana.url};
        await this.httpCheckStatusCode(urlObject.hostname, urlObject.port, '/api/health');
        grafana.status = {ok: true, configured: true};
      } catch (error) {
        grafana.status = {ok: false, configured: true, message: error.toString()};
      }
    } else {
      grafana.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return grafana;
  }

  /**
   * Build a response containing the information and status of the Notification Service
   * @return {Promise<Resolve>}
   */
  async getNotificationStatus(notification) {
    let notificationConfig = {};
    if (notification.isConfigured()) {
      notificationConfig = this.config.kafka;
      try {
        await notification.health();
        notificationConfig.status = {configured: true, ok: true};
      } catch (error) {
        notificationConfig.status = {configured: true, ok: false, message: error.name};
      }
    } else {
      notificationConfig.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return notificationConfig;
  }

  /**
   * Build a JSON response with AliECS GUI's configuration
   * @returns {JSON}
   */
  getGuiStatus() {
    let gui = {};
    if (projPackage?.version) {
      gui.version = projPackage.version;
    }
    if (this.config?.http?.hostname && this.config?.http?.port) {
      const con = {hostname: this.config.http.hostname, port: this.config.http.port};
      gui = Object.assign(gui, con);
      gui.status = {ok: true, configured: true};
    } else {
      gui.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return gui;
  }
}

module.exports = StatusService;
