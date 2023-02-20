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
'use strict';

/**
 * Service DTO representation
 */
class Service {
  /**
   * Initializing a Service object to empty values
   */
  constructor() {
    /**
     * @type {boolean}
     */
    this._enabled = false;

    /**
     * @type {object}
     */
    this._isUp = false;

    /**
     * @type {string}
     */
    this._errorMessage = '';


    /**
     * @type {string}
     */
    this._endpoint = '';

    /**
     * @type {object}
     */
    this._extras = {};

    /**
     * @type {string}
     */
    this._version = '';
  }

  /**
   * Method to build a Service object from multiple source and return a generalized Service
   * @param {object} service - json object with values of the service
   * @returns {Service}
   */
  static fromJSON(service) {
    const serviceObj = new Service();

    if (service.endpoint) {
      serviceObj._endpoint = service.endpoint;
      delete service.endpoint;
    } else if (service.hostname) {
      const protocol = `${service.protocol}://` ?? '';
      const hostname = service.hostname;
      const port = service.port ?? '';
      serviceObj._endpoint = protocol + hostname + port;
      delete service.protocol;
      delete service.hostname;
      delete service.port;
    }
    serviceObj._version = service.version ?? '';

    Object.keys(service).forEach((key) => serviceObj._extras[key] = service[key]);
    return serviceObj;
  }
}

exports.Service = Service;
