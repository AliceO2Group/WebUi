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

const url = require('url');
const projPackage = require('../../package.json');
const {httpGetJson} = require('./../utils.js');

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
  constructor(config, ctrlService, consulService) {
    this.config = config;
    this.ctrlService = ctrlService
    this.consulService = consulService;
    this.NOT_CONFIGURED = 'This service was not configured';
  }

  /**
   * Build a response containing the information and status of the Consul Serivce
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
      aliEcs = this.config.grpc;
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
   * Build a response containing the information and status of the Grafana Service
   * @return {Promise<Resolve>}
   */
  async getGrafanaStatus() {
    let grafana = {};
    if (this.config?.grafana?.url) {
      grafana = url.parse(this.config.grafana.url)
      try {
        await httpGetJson(grafana.hostname, grafana.port, '/api/health');
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
   * Build a response containing the information and status of the Kafka Service
   * @return {Promise<Resolve>}
   */
  async getKafkaStatus(kafkaConnector) {
    let kafka = {};
    if (kafkaConnector.isConfigured()) {
      kafka = this.config.kafka;
      try {
        await kafkaConnector.health();
        kafka.status = { configured: true, ok:  true };
      } catch (error) {
        kafka.status = { configured: true, ok:  false, message: error.name };
      }
    } else {
        kafka.status = {ok: false, configured: false, message: this.NOT_CONFIGURED};
    }
    return kafka;
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
