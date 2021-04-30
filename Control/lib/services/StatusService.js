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
        consulStatus.status = {ok: true};
      } catch (error) {
        consulStatus.status = {ok: false, message: error.toString()};
      }
    } else {
      consulStatus.status = {ok: false, message: this.NOT_CONFIGURED};
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
        aliEcs.status = {ok: true};
      } catch (error) {
        aliEcs.status = {ok: false, message: error.toString()};
      }
    } else {
      aliEcs.status = {ok: false, message: this.NOT_CONFIGURED};
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
    if (this.config?.grpc) {
      try {
        const coreInfo = await this.ctrlService.getIntegratedServicesInfo();
        Object.keys(coreInfo.services).forEach((service) => {
          const serv = coreInfo.services[service];
          serv.status = serv?.connectionState === 'READY' ? {ok: true} : {ok: false};
          integServices[service] = serv;
        });
        return integServices;
      } catch (error) {
        integServices['Integrated Services'] = {
          status: {ok: false, message: error.toString()}
        };
      }
    } else {
      integServices['Integrated Services'] = {
        status: {ok: false, message: this.NOT_CONFIGURED}
      };
    }
    return integServices;
  }

  /**
   * Build a response containing the information and status of the Grafana Service
   * @return {Promise<Resolve>}
   */
  async getGrafanaStatus() {
    let grafana = {};
    if (this.config?.http?.hostname && this.config?.grafana?.port) {
      grafana = this.config.grafana;
      grafana.hostname = this.config.http.hostname;
      try {
        await httpGetJson(this.config.http.hostname, this.config.grafana.port, '/api/health');
        grafana.status = {ok: true};
      } catch (error) {
        grafana.status = {ok: false, message: error.toString()};
      }
    } else {
      grafana.status = {ok: false, message: this.NOT_CONFIGURED};
    }
    return grafana;
  }

  /**
   * Build a response containing the information and status of the Kafka Service
   * @return {Promise<Resolve>}
   */
  async getKafkaStatus() {
    let kafka = {};
    if (this.config?.kafka?.port && this.config?.kafka?.hostname) {
      kafka = this.config.kafka;
      try {
        await httpGetJson(this.config.kafka.hostname, this.config.kafka.port, '/api/health');
        kafka.status = {ok: true};
      } catch (error) {
        kafka.status = {ok: false, message: error.toString()};
      }
    } else {
      kafka.status = {ok: false, message: this.NOT_CONFIGURED};
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
      gui.status = {ok: true};
    } else {
      gui.status = {ok: false, message: this.NOT_CONFIGURED};
    }
    return gui;
  }
}

module.exports = StatusService;
