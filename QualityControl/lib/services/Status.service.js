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

import { promisify } from 'node:util';
import { exec } from 'node:child_process';

import { LogManager } from '@aliceo2/web-ui';
import { IntegratedServices } from './../../common/library/enums/Status/integratedServices.enum.js';
import { ServiceStatus } from '../../common/library/enums/Status/serviceStatus.enum.js';

const QC_VERSION_EXEC_COMMAND = 'yum info o2-QualityControl | awk \'/Version/ {print $3}\'';
const execPromise = promisify(exec);

/**
 * Service for retrieving information and status of QCG dependencies
 */
export class StatusService {
  /**
   * Setup StatusService constructor and initialize needed dependencies
   * @param {object} packageInfo - object containing partial information from package.json file
   * @param {object} config - partial configuration of QCG setup
   */
  constructor(packageInfo, config = {}) {
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'qcg'}/status-service`);

    /**
     * @type {CcdbService}
     */
    this._dataService = undefined;

    /**
     * @type {BookkeepingService}
     */
    this._bookkeepingService = undefined;

    /**
     * @type {WebSocket}
     */
    this._ws = undefined;

    /**
     * @type {?AliEcsSynchronizer}
     */
    this._aliEcsSynchronizer = undefined;

    this._packageInfo = packageInfo;
    this._config = config;
  }

  /**
   * Send back info about the framework
   * @param {IntegratedServices} service - the integrated service to retrieve information for
   * @returns {object} - object containing status and framework information
   */
  async retrieveServiceStatus(service) {
    let result = undefined;
    switch (service) {
      case IntegratedServices.QCG:
        result = this.retrieveOwnStatus();
        break;
      case IntegratedServices.QC:
        result = await this.retrieveQcVersion();
        break;
      case IntegratedServices.CCDB:
        result = await this.retrieveDataServiceStatus();
        break;
      case IntegratedServices.KAFKA:
        result = this.retrieveKafkaServiceStatus();
        break;
      case IntegratedServices.BOOKKEEPING:
        result = this.retrieveBookkeepingServiceStatus();
        break;
    }
    return result;
  }

  /**
   * Method that builds an object with some information about the server itself
   * @returns {object} - info on version, host and port where application is deployed
   */
  retrieveOwnStatus() {
    return {
      name: 'QCG',
      status: { ok: true, category: ServiceStatus.SUCCESS },
      version: this._packageInfo?.version ?? '',
      extras: {
        clients: this._ws?.server?.clients?.size ?? -1,
      },
    };
  }

  /**
   * Method to execute QC version retrieval command
   * @returns {string} - version of QC deployed on the system
   */
  async retrieveQcVersion() {
    let status = { ok: false, category: ServiceStatus.NOT_CONFIGURED };
    let version = 'Not part of an FLP deployment';

    if (this._config.qc?.enabled) {
      try {
        const { stdout } = await execPromise(QC_VERSION_EXEC_COMMAND, { timeout: 6000 });
        version = stdout.trim();
        status = { ok: true, category: ServiceStatus.SUCCESS };
      } catch (error) {
        status = { ok: false, category: ServiceStatus.ERROR, message: error.message || error };
        this._logger.errorMessage(error, { level: 99, system: 'GUI', facility: 'qcg/status-service' });
      }
    }

    return { name: 'QC', status, version, extras: {} };
  }

  /**
   * Retrieve data service (CCDB) status and issue if any
   * @returns {Promise<{object}>} - status of the data service
   */
  async retrieveDataServiceStatus() {
    const statusPackage = { name: 'CCDB', version: '', extras: {} };
    try {
      const { version: dataServiceVersion } = await this._dataService.getVersion();
      return {
        ...statusPackage,
        status: { ok: true, category: ServiceStatus.SUCCESS },
        version: dataServiceVersion,
      };
    } catch (err) {
      return {
        ...statusPackage,
        status: { ok: false, category: ServiceStatus.ERROR, message: err.message || err },
      };
    }
  }

  /**
   * Retrieve the kafka service status response
   * @returns {object} - status of the kafka service
   */
  retrieveKafkaServiceStatus() {
    const status = this._aliEcsSynchronizer?.status;
    return {
      name: IntegratedServices.KAFKA,
      status: {
        ok: status === ServiceStatus.SUCCESS,
        category: status ?? ServiceStatus.NOT_CONFIGURED,
      },
      extras: {
        ...this._aliEcsSynchronizer?.extraInfo ?? {},
      },
    };
  }

  /**
   * Retrieve the bookkeeping service status response and its public configuration
   * @returns {object} - status of the bookkeeping service
   */
  retrieveBookkeepingServiceStatus() {
    if (this._bookkeepingService?.active) {
      return {
        name: IntegratedServices.BOOKKEEPING,
        version: this._bookkeepingService.version,
        status: { ok: true, category: ServiceStatus.SUCCESS },
        extras: {
          BASE_URL: this._bookkeepingService.url,
          PARTIAL_RUN_DETAILS: '?page=run-detail&runNumber=',
        },
      };
    } else if (this._bookkeepingService.config) {
      return {
        name: IntegratedServices.BOOKKEEPING,
        status: {
          ok: false,
          category: ServiceStatus.ERROR,
          message: this._bookkeepingService.error || 'Unable to connect to Bookkeeping service',
        },
      };
    }
    return {
      name: IntegratedServices.BOOKKEEPING,
      status: { ok: false, category: ServiceStatus.NOT_CONFIGURED },
    };
  }

  /*
   * Getters & Setters
   */

  /**
   * Set service to be used for querying status of data layer (CCDB)
   * @param {CcdbService} dataService - service used for retrieving QC objects
   * @returns {void}
   */
  set dataService(dataService) {
    this._dataService = dataService;
  }

  /**
   * Set service to be used for querying status of the Bookkeeping service.
   * @param {BookkeepingService} bookkeepingService - service used for retrieving Bookkeeping status
   * @returns {void}
   */
  set bookkeepingService(bookkeepingService) {
    this._bookkeepingService = bookkeepingService;
  }

  /**
   * Set instance of websocket server
   * @param {WebSocket} ws - instance of the WS server
   * @returns {void}
   */
  set ws(ws) {
    this._ws = ws;
  }

  /**
   * Set instance of `AliEcsSynchronizer`
   * @param {AliEcsSynchronizer} aliEcsSynchronizer - instance of the `AliEcsSynchronizer`
   * @returns {void}
   */
  set aliEcsSynchronizer(aliEcsSynchronizer) {
    this._aliEcsSynchronizer = aliEcsSynchronizer;
  }
}
