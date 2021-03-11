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
   * @return {JSON} {result, ok, status}
   */
  async getObjectByName(objectName, timestamp = -1) {
    try {
      if (timestamp === -1) {
        timestamp = Date.now();
      }
      // TODO update link to localhost + prefix
      const filename = `http://ccdb-test.cern.ch:8080/${objectName}/${timestamp}`;
      let [qcObject, timeStampsReq] = await Promise.all([
        new Promise(async (resolve, reject) => {
          try {
            const file = await JSROOT.openFile(filename);
            const obj = await file.readObject("ccdb_object");
            resolve(obj);
          } catch (error) {
            reject({error: 'Could not load object'});
          }
        }),
        this.model.loader.get(`/api/readObjectData?objectName=${objectName}&timestamp=${timestamp}`)
      ]);
      const {result, ok, status} = timeStampsReq;
      if (ok) {
        const obj = {qcObject, timestamps: result.timestamps};
        return RemoteData.success(obj);
      } else {
        if (status === 404) {
          return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
        }
        return RemoteData.failure(`${status}: Object '${objectName}' could not be loaded`);
      }
    } catch (error) {
      return RemoteData.failure(`Object '${objectName}' could not be loaded`);
    }
  }

  /**
   * Make a set of requests to CCDB to get the object file through JSROOT
   * It will return a map in which the value can contain:
   * * qcObject - if request for receiving and opening the file was successfull
   * * error - if request fails 'Unable to load object'
   * @param {[string]} objectsNames
   * @return {Remodata.Success(Map<String, JSON>)}
   */
  async getObjectsByName(objectsNames) {
    const objectsMap = {};
    await Promise.allSettled(
      objectsNames.map(async (objectName) => {
        // TODO update link to localhost + prefix
        const filename = `http://ccdb-test.cern.ch:8080/${objectName}/${Date.now()}`;
        try {
          const file = await JSROOT.openFile(filename);
          const obj = await file.readObject("ccdb_object");
          objectsMap[objectName] = {qcObject: obj};
        } catch (error) {
          objectsMap[objectName] = {error: `Unable to load object ${objectName}`};
        }
      })
    );
    return RemoteData.Success(objectsMap);
  }
}
