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
const projPackage = require('./../../package.json');
const {httpGetJson} = require('./../utils.js');
const {Service} = require('./../dtos/Service.js');
const {SERVICES: {STATUS}} = require('./../common/constants.js');

const CONSUL_KEY = 'CONSUL';
const GRAFANA_KEY = 'GRAFANA';
const NOTIFICATION_SYSTEM_KEY = 'NOTIFICATION_SYSTEM';

const ALIECS_SERVICES_KEY = 'ALIECS_SERVICES';
const ALIECS_CORE_KEY = 'ALIECS_CORE';
const APRICOT_KEY = 'APRICOT';

const NOT_CONFIGURED_MESSAGE = 'This service was not configured';

/**
 * Gateway for all Status Consumer calls
 */
class StatusService {

  /**
   * Setup StatusService
   * @param {JSON} config - server configuration
   * @param {ControlService} ctrlService
   * @param {ConsulService} consulService
   * @param {ApricotService} apricotService
   * @param {NotificationService} notificationService
   * @param {WebSocketController} wsService
   */
  constructor(config, ctrlService, consulService, apricotService, notificationService, wsService) {
    this.config = config;

    /**
     * @type {ConsulService | undefined}
     */
    this._consulService = consulService;

    /**
     * @type {NotificationService | undefined}
     */
    this._notificationService = notificationService;

    /**
     * @type {ControlService | undefined}
     */
    this._ctrlService = ctrlService

    /**
     * @type {ApricotService | undefined}
     */
    this._apricotService = apricotService;

    this._wsService = wsService;

    this._statusMap = new Map();
  }

  /**
   * Retrieve status of the ServiceDiscovery system (Consul)
   * @returns {Promise<JSON>} - return of JSON with requested information 
   */
  async retrieveConsulStatus() {
    let status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: true};
    if (this._consulService) {
      try {
        await this._consulService.getConsulLeaderStatus();
        status = {ok: true, configured: true, isCritical: true};
      } catch (error) {
        status = {ok: false, configured: true, isCritical: true, message: error.toString()};
      }
    }
    this._updateStatusMaps(CONSUL_KEY, status);
    return status;
  }

  /**
   * Build a JSON object with consul configuration and status
   * @returns {Promise<JSON>} - resolves with a JSON object containing information about the service
   */
  async getConsulAsComponent() {
    const status = await this.retrieveConsulStatus();
    return {
      status,
      name: 'Consul - KV Store',
      ...status.configured && Service.fromObjectAsJson(this.config?.consul)
    }
  }

  /**
   * Provide configuration of AliECS Core and retrieve current status plus extra information
   * Compared to the other components, AliECS sends back needed info via its status check thus it is not split in multiple calls
   * @returns {Promise<Resolve>}
   */
  async retrieveAliEcsCoreInfo() {
    let configuration = {};
    let status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: true};
    if (this._ctrlService?.coreConfig) {
      const {hostname, port, timeout, maxMessageLength} = this._ctrlService.coreConfig;
      configuration = {
        endpoint: `${hostname}:${port}`,
        timeout,
        maxMessageLength,
      };
      try {
        const coreInfo = await this._ctrlService.getAliECSInfo();
        Object.assign(configuration, coreInfo);
        status = {ok: true, configured: true, isCritical: true};
      } catch (error) {
        status = {ok: false, configured: true, isCritical: true, message: error.toString()};
      }
    }
    const aliecs = Object.assign({status, name: 'AliECS Core'}, Service.fromObjectAsJson(configuration))
    this._updateStatusMaps(ALIECS_CORE_KEY, status);
    return aliecs;
  }

  /**
   * Build a response containing the information and status of the integrated services
   * * If core responds successfully than each service will be added to a Map with its name as the key and the general key for error case
   * will be removed
   * * Otherwise, an entry with label 'Integrated Services' will be added in the response
   * @returns {Promise<Resolve>}
   */
  async retrieveAliECSIntegratedInfo() {
    let integServices = {};
    if (this._ctrlService) {
      try {
        const {services} = await this._ctrlService.getIntegratedServicesInfo();
        Object.entries(services)
          .filter(([key]) => key !=='testplugin')
          .forEach(([key, value]) => {
            const status = {
              ok: value?.connectionState !== 'TRANSIENT_FAILURE' && value?.connectionState !== 'SHUTDOWN',
              configured: Boolean(value?.enabled),
              isCritical: true
            };
            delete value.enabled;
            value.name = value.name ?? key;
            integServices[key] = {
              status,
              ...Service.fromObjectAsJson(value)
            };
            this._updateStatusMaps(ALIECS_SERVICES_KEY, {status: {ok: true, configured: true}});
            this._updateStatusMaps(`INTEG_SERVICE-${key.toLocaleUpperCase()}`, integServices[key]);
          });
      } catch (error) {
        const status = {ok: false, configured: true, message: error.toString(), isCritical: true};
        this._updateStatusMaps(ALIECS_SERVICES_KEY);
        integServices = {
          ALL: {status}
        };
      }
    } else {
      const status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: true};
      this._updateStatusMaps(ALIECS_SERVICES_KEY, status);
      integServices = {
        ALL: {status}
      }
    }
    return integServices;
  }

  /**
   * Retrieve status of Apricot Service
   * @returns {Promise<JSON>} - return of JSON with requested information 
   */
  async retrieveApricotStatus() {
    let status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: true};
    if (this._apricotService) {
      try {
        await this._apricotService.getStatus();
        status = {ok: true, configured: true, isCritical: true};
      } catch (error) {
        status = {ok: false, configured: true, isCritical: true, message: error.toString()}
      }
    }
    this._updateStatusMaps(APRICOT_KEY, status);
    return status;
  }

  /**
   * Build a response containing the information and status of Apricot Service
   * @returns {Promise<JSON>} - JSON with requested information
   */
  async getApricotAsComponent() {
    const status = await this.retrieveApricotStatus();
    return {
      status,
      name: 'Apricot',
      ...status.configured && Service.fromObjectAsJson(this.config.apricot)
    };
  }

  /**
  * Retrieve status of Monitoring System (Grafana)
   * @returns {Promise<JSON>} - return of JSON with requested information 
   */
  async retrieveGrafanaStatus() {
    let status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: false};
    if (this.config?.grafana?.url) {
      try {
        const {hostname, port} = url.parse(this.config.grafana.url);
        await httpGetJson(hostname, port, '/api/health', {
          statusCodeMin: 200,
          statusCodeMax: 301,
          rejectMessage: 'Invalid status code: '
        });
        status = {ok: true, configured: true, isCritical: false};
      } catch (error) {
        status = {ok: false, configured: true, isCritical: false, message: error.toString()};
      }
    }
    this._updateStatusMaps(GRAFANA_KEY, status);
    return status;
  }

  /**
   * Build a response containing the information and status of the Grafana Service
   * @return {Promise<Resolve>}
   */
  async getGrafanaAsComponent() {
    const status = await this.retrieveGrafanaStatus();
    return {
      status,
      name: 'Grafana - Monitoring',
      ...status.configured && Service.fromObjectAsJson({endpoint: this.config.grafana.url})
    };
  }

  /**
   * Retrieve status of the notification system (Kafka)
   */
  async retrieveNotificationSystemStatus() {
    let status = {ok: false, configured: false, message: NOT_CONFIGURED_MESSAGE, isCritical: false};
    if (this._notificationService && this._notificationService.isConfigured()) {
      try {
        await this._notificationService.health();
        status = {configured: true, ok: true, isCritical: false};
      } catch (error) {
        status = {configured: true, ok: false, isCritical: false, message: error.name};
      }
    }
    this._updateStatusMaps(NOTIFICATION_SYSTEM_KEY, status);
    return status;
  }
  /**
   * Build a response containing the information and status of the Notification Service
   * @param {object} notification - configuration of Notification Service, including Kafka brokers
   * @return {Promise<Resolve>}
   */
  async getNotificationSystemAsComponent() {
    const status = await this.retrieveNotificationSystemStatus();
    return {
      status,
      name: 'Kafka - Notification',
      ...status.configured && Service.fromObjectAsJson(this.config?.kafka)
    };
  }

  /**
   * Build a JSON response with AliECS GUI's configuration
   * @returns {JSON}
   */
  getGuiStatus() {
    let gui = {
      name: 'AliECS GUI'
    };
    if (projPackage?.version) {
      gui.version = projPackage.version;
    }
    gui.status = {ok: true, configured: true, isCritical: true};
    return gui;
  }

  /**
   * Update the maps with relation to statuses:
   * - statusMap should always save the new status;
   * - statusMapUpdate should only save it if the value has changed and delete the pair if it exists and is the same value
   * @param {string} key - 
   * @param {object} value - JSON component with status
   */
  _updateStatusMaps(key, value) {
    this._statusMap.set(key, value);
    this._wsService?.updateData(STATUS, key, value);
  }

  /**
   * Getters / Setters
   */

  /**
   * Return the current stored statuses of the components interacting with AliECS GUI;
   * @returns {object} - // TODO set type
   */
  get statusMap() {
    return this._statusMap;
  }
}

exports.StatusService = StatusService;
