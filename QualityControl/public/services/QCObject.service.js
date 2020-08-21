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
  * Ask server for an object by name
  * @param {string} objectName
  * @return {JSON} {result, ok, status}
  */
  async getObjectByName(objectName) {
    const {result, ok, status} = await this.model.loader.get(`/api/readObjectData?objectName=${objectName}`);
    if (ok) {
      return RemoteData.success(result);
    } else if (status === 404) {
      return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
    } else {
      return RemoteData.failure(`${status}: Object '${objectName}' could not be loaded`);
    }
  }

  /**
   * Ask server for multiple objects by their name
   * @param {[string]} objectsNames
   */
  async getObjectsByName(objectsNames) {
    const {result, ok} = await this.model.loader.post(`/api/readObjectsData`, {objectsNames});
    if (ok) {
      return RemoteData.success(result);
    } else {
      return RemoteData.failure(result);
    }
  }
}
