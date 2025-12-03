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
    this.filterModel = model.filterModel;

    this.objectsLoadedMap = {};
    // Qcobject --ccdb info; root plot, query params? in ccdb info
  }

  /**
   * Retrieve a list of all objects from CCDB
   * @param {Class<Observable>} that - object extending observer class to notify component on request end
   * @param {Map<FilterType, string>} filterMap - optional argument to change default filter behaviour.
   * @returns {JSON} List of Objects
   */
  async listObjects(that = this.model, filterMap = this.filterModel.filterMap) {
    this.list = RemoteData.loading();
    that.notify();

    const hasFilters = Object.values(filterMap).some(Boolean);
    const fields = hasFilters ? ['path'] : undefined; // If there are filters more unneeded fields are sent down.
    const url = this._buildURL('/api/objects?', undefined, undefined, filterMap, fields);

    const { result, ok } = await this.model.loader.get(url, {}, true);

    if (ok) {
      this.list = RemoteData.success(result);
      this.model.object.tree.initTree('database');
      this.model.object.tree.addChildren(result);
    } else {
      this.list = RemoteData.failure({ message: result.message });
    }

    that.notify();
  }

  /**
   * Ask server for an object by name and optionally timestamp
   * If timestamp is not provided, Date.now() will be used to request latest version of the object
   * @param {string} objectName - name/path of the object to get
   * @param {string} id - if as per CCDB storage
   * @param {number} validFrom - timestamp in ms
   * @param {Class<Observable>} that - object to be used to notify
   * @returns {Promise<RemoteData>} {result, ok, status}
   */
  async getObjectByName(objectName, id = '', validFrom = undefined, that = this) {
    this.objectsLoadedMap[objectName] = RemoteData.loading();
    that.notify();

    try {
      // `/api/object?path=${objectName}&timestamp=${timestamp}&filter=${filter}`
      const filters = this.filterModel.isRunModeActivated
        ? { RunNumber: this.filterModel.runNumber }
        : this.filterModel.filterMap;
      const url = this._buildURL(`/api/object?path=${objectName}`, id, validFrom, filters);
      const { result, ok } = await this.model.loader.get(url, {}, true);
      if (ok) {
        result.qcObject = {
          root: JSROOT.parse(result.root),
          drawOptions: JSON.parse(JSON.stringify(result.drawOptions)),
          displayHints: JSON.parse(JSON.stringify(result.displayHints)),
        };
        delete result.root;
        this.objectsLoadedMap[objectName] = RemoteData.success(result);
        that.notify();
        return RemoteData.success(result);
      } else {
        const failure = RemoteData.failure(result.message || `Object "${objectName}" could not be found.`);
        this.objectsLoadedMap[objectName] = failure;
        that.notify();
        return failure;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      const failure = RemoteData.failure(error.message || `Object "${objectName}" could not be loaded.`);
      this.objectsLoadedMap[objectName] = failure;
      that.notify();
      return failure;
    }
  }

  /**
   * Ask server for an object by name and optionally timestamp
   * If timestamp is not provided, Date.now() will be used to request latest version of the object
   * @param {string} objectId - name/path of the object to get
   * @param {string} id - id/etag as stored by CCDB
   * @param {number} timestamp - timestamp in ms
   * @param {Class<Observable>} that - object to be used to notify
   * @returns {Promise<RemoteData>} {result, ok, status}
   */
  async getObjectById(objectId, id = '', timestamp = undefined, that = this) {
    try {
      // `/api/object?path=${objectName}&timestamp=${timestamp}&filter=${filter}`
      const url = this._buildURL(`/api/object/${objectId}?`, id, timestamp);

      const { result, ok } = await this.model.loader.get(url);
      if (ok) {
        result.qcObject = {
          root: JSROOT.parse(result.root),
          drawingOptions: result.drawOptions,
          displayHints: result.displayHints,
        };
        const objectName = result.name;
        delete result.root;
        this.objectsLoadedMap[objectName] = RemoteData.success(result);
        that.notify();
        return RemoteData.success(result);
      } else {
        const failure = RemoteData.failure(result.message || `Object with ID "${objectId}" could not be found.`);
        this.objectsLoadedMap[objectId] = failure;
        that.notify();
        return failure;
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
      const failure = RemoteData.failure(error.message || `Object with ID "${objectId}" could not be loaded.`);
      this.objectsLoadedMap[objectId] = failure;
      that.notify();
      return failure;
    }
  }

  /**
   * Given a prebuild URL, append timestamp and filter if provided
   * @param {string} url - initial URL with objectId or object name
   * @param {string} id - id of the object
   * @param {number} validFrom - timestamps in ms
   * @param {Map<FilterType,string>} filterMap - object of filters by which the objects will be filterd
   * @param {Array<string>} fields - The fields that are to be send from the backend.
   * @returns {string} - url with appended parameters
   */
  _buildURL(url, id, validFrom = undefined, filterMap = this.filterModel.filterMap, fields = undefined) {
    const filterAsString = Object.entries(filterMap).map(([key, value]) => `filters[${key}]=${value}`).join('&');
    url += `&${filterAsString}`;

    if (validFrom) {
      url += `&validFrom=${validFrom}`;
    }
    if (id) {
      url += `&id=${id}`;
    }
    if (Array.isArray(fields)) {
      url += `&fields[]=${fields.join('fields[]=')}`;
    }
    return url;
  }

  /**
   * Ask server for all available objects from CCDB
   * @param {boolean} inRunMode - if true, inRunMode is added to the path
   * @returns {JSON} List of Objects
   * @deprecated
   */
  async getObjects(inRunMode = false) {
    const hasFilters = Object.values(this.filterModel.filterMap).some(Boolean);
    const fields = hasFilters ? ['path'] : undefined; // If there are filters more unneeded fields are sent down.
    const url = this._buildURL(
      `/api/objects?${inRunMode ? 'inRunMode=true' : ''}`,
      undefined,
      undefined,
      inRunMode ? { RunNumber: this.filterModel.runNumber } : this.filterModel.filterMap,
      fields,
    );
    const { result, ok } = await this.model.loader.get(url);
    return ok ? RemoteData.success(result) : RemoteData.failure(result);
  }
}
