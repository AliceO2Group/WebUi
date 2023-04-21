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

import { RemoteData } from '/js/src/index.js';

/**
 * Quality Control Object service to get/send data
 */
export default class QCObjectService {
  /**
   * Initialize service
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    this.model = model;
    this.list = RemoteData.notAsked(); // List of objects in CCDB with some of their parameters

    this.objectsLoadedMap = {};
    // Qcobject --ccdb info; root plot, query params? in ccdb info
  }

  /**
   * Retrieve a list of all objects from CCDB
   * @param {Class<Observable>} that - object extending observer class to notify component on request end
   * @returns {JSON} List of Objects
   */
  async listObjects(that = this.model) {
    this.list = RemoteData.loading();
    that.notify();

    const { result, ok } = await this.model.loader.get('/api/objects/all', {}, true);

    if (ok) {
      this.list = RemoteData.success(result);
      this.model.object.sideTree.initTree('database');
      this.model.object.sideTree.addChildren(result);
    } else {
      this.list = RemoteData.failure({ message: result.message });
    }

    that.notify();
  }

  /**
   * Ask server for an object by name and optionally timestamp
   * If timestamp is not provided, Date.now() will be used to request latest version of the object
   * @param {string} objectName - name/path of the object to get
   * @param {number} timestamp - timestamp in ms
   * @param {string} filter - filter as string to be applied on query
   * @param {Class<Observable>} that - object to be used to notify
   * @returns {Promise<RemoteData>} {result, ok, status}
   */
  async getObjectByName(objectName, timestamp = -1, filter = '', that = this) {
    this.objectsLoadedMap[objectName] = RemoteData.loading();
    that.notify();

    try {
      // `/api/objects?path=${objectName}&timestamp=${timestamp}&filter=${filter}`
      let url = `/api/objects?path=${objectName}`;
      if (timestamp === -1 && filter === '') {
        url += `&timestamp=${Date.now()}`;
      } else if (filter !== '') {
        url += `&filter=${filter}`;
      } else {
        url += `&timestamp=${timestamp}`;
      }
      const { result, ok } =
        await this.model.loader.get(url);
      if (ok) {
        result.qcObject = {
          root: JSROOT.parse(result.root),
          drawingOptions: result.drawOptions,
          displayHints: result.displayHints,
        };
        delete result.root;
        this.objectsLoadedMap[objectName] = RemoteData.success(result);
        that.notify();
        return RemoteData.success(result);
      } else {
        this.objectsLoadedMap[objectName] = RemoteData.failure(`404: Object "${objectName}" could not be found.`);
        that.notify();
        return RemoteData.failure(`404: Object "${objectName}" could not be found.`);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      this.objectsLoadedMap[objectName] = RemoteData.failure(`404: Object "${objectName}" could not be loaded.`);
      that.notify();
      return RemoteData.failure(`Object '${objectName}' could not be loaded`);
    }
  }

  /**
   * Ask server for all available objects from CCDB
   * @returns {JSON} List of Objects
   * @deprecated
   */
  async getObjects() {
    const { result, ok } = await this.model.loader.get('/api/objects/all');
    return ok ? RemoteData.success(result) : RemoteData.failure(result);
  }

  /**
   * Ask server for all available objects
   * @returns {JSON} List of Objects
   */
  async getOnlineObjects() {
    const { result, ok } = await this.model.loader.get('/api/listOnlineObjects');
    return ok ? RemoteData.success(result) : RemoteData.failure(result);
  }

  /**
   * Ask server for online mode service status
   * @returns {RemoteData} - boolean value encapsulated in a RemoteData object
   */
  async isOnlineModeConnectionAlive() {
    const { ok } = await this.model.loader.get('/api/isOnlineModeConnectionAlive');
    return ok ? RemoteData.success(ok) : RemoteData.failure(ok);
  }
}
