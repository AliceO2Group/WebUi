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

import { Log } from '@aliceo2/web-ui';

/**
 * Service for retrieving information and status of QCG dependencies
 */
export class StatusService {
  /**
   * Setup StatusService constructor and initialize needed dependencies
   * @param {object} packageInfo - object containing partial information from package.json file
   */
  constructor(packageInfo) {
    this._logger = new Log(`${process.env.npm_config_log_label ?? 'qcg'}/status-service`);

    /**
     * @type {CcdbService}
     */
    this._dataService = undefined;

    /**
     * @type {ConsulService}
     */
    this._onlineService = undefined;

    this._packageInfo = packageInfo;
  }

  /**
   * Method that builds an object with some information about the server itself
   * @returns {object} - info on version, host and port where application is deployed
   */
  retrieveOwnStatus() {
    return {
      status: { ok: true },
      version: this._packageInfo?.version ?? '-',
    };
  }

  /**
   * Send back info about the framework
   * @returns {object} - object containing status and framework information
   */
  async retrieveFrameworkInfo() {
    return {
      qcg: this.retrieveOwnStatus(),
      ccdb: {
        status: await this.retrieveDataServiceStatus(),
      },
      consul: {
        status: await this.retrieveOnlineServiceStatus(),
      },
    };
  }

  /**
   * Retrieve data service (CCDB) status and issue if any
   * @returns {Promise<{object}>} - status of the data service
   */
  async retrieveDataServiceStatus() {
    try {
      await this._dataService.isConnectionUp();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || err };
    }
  }

  /**
   * Retrieve status of the online service (Consul) if it was configured and issue if any
   * @returns {Promise<Resolve, Reject>} - status of the online service
   */
  async retrieveOnlineServiceStatus() {
    if (!this._onlineService) {
      return { ok: false, message: 'Live Mode was not configured' };
    }
    try {
      await this._onlineService.getConsulLeaderStatus();
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message || err };
    }
  }

  /*
   * Getters & Setters
   */

  /**
   * Set service to be used for querying status of data layer (CCDB)
   * @param {CcdbService} dataService - service used for retrieving QC objects
   */
  set dataService(dataService) {
    this._dataService = dataService;
  }

  /**
   * Set service to be used for querying status of online mode provider (Consul)
   * @param {ConsulService} onlineService - service used for retrieving list of objects currently being produced
   */
  set onlineService(onlineService) {
    this._onlineService = onlineService;
  }
}
