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

const KNOWN_FIELDS = ['data', 'hostname', 'port', 'connectionState', 'enabled', 'endpoint'];

/**
 * Service DTO representation
 * @property {string} name
 * @property {string} endpoint
 * @property {string} [version]
 * @property {string} [connectionState] [READY, CONNECTING, TRANSIENT_FAILURE, IDLE, SHUTDOWN]
 * @property {string} originalName
 * @property {Map<string, string>} extras
 */
class Service {
  /**
   * Initializing a Service object to empty object
   */
  constructor() {}

  /**
   * Method to build a Service object from multiple sources and return a JSON version of Service
   * @param {object} service - json object with values of the service
   * @returns {JSON}
   */
  static fromObjectAsJson(service) {
    service = JSON.parse(JSON.stringify(service));

    const name = Service._getNameOfService(service);
    const endpoint = Service._getEndpoint(service);
    const data = Service._getDataOfService(service);

    const serviceToReturn = {
      ...name && { name },
      ...endpoint && { endpoint },
      ...service.version && { version: service.version },
      ...service.connectionState && { connectionState: service.connectionState },
      extras: { ...data },
    };
    Object.keys(service)
      .filter((name) => !KNOWN_FIELDS.includes(name))
      .filter((name) => !serviceToReturn[name])
      .forEach((key) => serviceToReturn.extras[key] = service[key]);
    return serviceToReturn;
  }

  /**
   * Given a general service object, build the endpoint of it or return undefined if not possible
   * @param {object} service
   * @returns {string|undefined}
   */
  static _getEndpoint(service) {
    if (service.endpoint) {
      return service.endpoint;
    } else if (service.hostname) {
      const protocol = service.protocol ? `${service.protocol}://` : '';
      const { hostname } = service;
      const port = service.port ?? '';
      return `${protocol}${hostname}:${port}`;
    }
    return undefined;
  }

  /**
   * Given a general service object, return its trimmed value if there is or undefined
   * @param {object} service
   * @param service.name
   * @returns {string|undefined}
   */
  static _getNameOfService({ name }) {
    return name && name?.trim() !== '' ? name : undefined;
  }

  /**
   * Given a general service object, look for AliECS Integrated services particularities such as "data" field of type string and return it parsed as JSON
   * @param {object} service
   * @param service.data
   * @returns {JSON|undefined}
   */
  static _getDataOfService({ data }) {
    if (data && typeof data === 'string') {
      try {
        const dataJson = JSON.parse(data);
        if (Object.keys(dataJson).length > 0) {
          return dataJson;
        }
      } catch (error) {
        console.error(error);
      }
    }
    return undefined;
  }
}

exports.Service = Service;
