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

/* global JSROOT */

import {RemoteData} from '/js/src/index.js';

/**
 * Quality Control Object service to get/send data
 */
export default class QCObjectService {
  /**
   * Initialize service
   * @param {Object} model
   */
  constructor(model) {
    this.model = model;
  }

  /**
   * Ask server for all available objects
   * @return {JSON} List of Objects
   */
  async getObjects() {
    const {result, ok} = await this.model.loader.get('/api/listObjects');
    if (ok) {
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }

  /**
   * Ask server for all available objects
   * @return {JSON} List of Objects
   */
  async getOnlineObjects() {
    const {result, ok} = await this.model.loader.get('/api/listOnlineObjects');
    if (ok) {
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }

  /**
   * Ask server for online mode service status
   */
  async isOnlineModeConnectionAlive() {
    const {ok} = await this.model.loader.get('/api/isOnlineModeConnectionAlive');
    if (ok) {
      return RemoteData.success(ok);
    } else {
      return RemoteData.failure(ok);
    }
  }

  /**
   * Ask server for an object by name and optionally timestamp
   * If timestamp is not provided, Date.now() will be used to request latest version of the object
   * @param {string} objectName
   * @param {number} timestamp
   * @return {Promise<RemoteData>} {result, ok, status}
   */
  async getObjectByName(objectName, timestamp = -1) {
    try {
      if (timestamp === -1) {
        timestamp = Date.now();
      }
      const {result, ok, status} =
        await this.model.loader.get(`/api/object/info?path=${objectName}&timestamp=${timestamp}`);
      if (ok) {
        const root = await this.model.loader.get(`/api/object/root?path=${objectName}&timestamp=${timestamp}`);
        const obj = {
          info: result.info,
          timestamps: result.timestamps,
          qcObject: JSROOT.parse(root.result)
        };
        return RemoteData.success(obj);
      } else if (status === 404) {
        return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
      }
      return RemoteData.failure(`${status}: Object '${objectName}' could not be loaded`);
    } catch (error) {
      console.error(error);
      return RemoteData.failure(`Object '${objectName}' could not be loaded`);
    }
  }

  /**
   * Retrieve the JSON version of a ROOT Object through JSROOT
   * @param {string} objectName - full path object name
   * @return {RemoteData}
   */
  async getObjectByNameOnly(objectName) {
    try {
      const {result, ok} = await this.model.loader.get(`/api/object/root?path=${objectName}`);
      if (ok) {
        return RemoteData.success({qcObject: JSROOT.parse(result)});
      } else {
        throw new Error();
      }
    } catch (error) {
      return RemoteData.failure(`Unable to load object ${objectName}`);
    }
  }
}
