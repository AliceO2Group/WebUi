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

import { httpGetJson } from '../utils/utils.js';

/**
 * BookkeepingService class to be used to retrieve data from Bookkeeping
 */
export class BookkeepingService {
  constructor({ url, token, refreshRate }) {
    this._url = url;
    const { protocol, hostname, port } = url ? new URL(this._url) : {};
    this._hostname = hostname;
    this._port = port;
    this._protocol = protocol;

    this._token = token;
    this.refresh_interval = refreshRate ?? 24 * 60 * 60 * 1000;

    this._runTypes = [];
  }

  /**
   * Get the list of run types that is currently known to the bookkeeping service.
   * @returns {Array<string>} - list of run types
   */
  getRunTypes() {
    return this._runTypes;
  }

  /**
   * Retrieve list of run types from the bookkeeping service
   * @returns {Promise<void,error>} - resolves when the list of run types is available
   */
  async retrieveRunTypes() {
    try {
      const { data } = await httpGetJson(
        this._hostname,
        this._port,
        'api/runTypes',
        {
          protocol: this._protocol,
          rejectUnauthorized: false,
        },
      );
      for (const type of data) {
        this._runTypes.push(type.id);
      }
    } catch {
      this._runTypes = [
        'COSMICS',
        'PHYS_HI',
        'PHYS_pp',
        'SYNTHETIC',
        'TECHNICAL',
      ];
    }
  }

  /**
   * Returns the interval in milliseconds for how often the list of run types should be refreshed.
   * @returns {number} - interval in milliseconds
   */
  get refreshInterval() {
    return this.refresh_interval;
  }
}
