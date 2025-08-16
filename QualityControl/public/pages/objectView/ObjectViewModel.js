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

import { setBrowserTabTitle } from '../../common/utils.js';
import { Observable, RemoteData } from '/js/src/index.js';

/**
 * Model namespace for ObjectViewPage
 */
export default class ObjectViewModel extends Observable {
  /**
   * Initialize model with empty values
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    super();

    this.model = model;

    /**
     * @type {RemoteData}
     * should contain:
     * {
     *  ...objectProperties as per ObjectDTO: '' // built specifically for the page
     *  root: JSON version of the root object to plot
     *  timestampList: '',
     * }
     */
    this.selected = RemoteData.notAsked();

    this.drawingOptions = [];
    this.displayHints = [];
    this.ignoreDefaults = false;

    /**
     * @type {object} TODO add it as FilterModel
     */
    this.filter = {};

    this._filterVisibility = true;
  }

  /**
   * Method to initialize page data
   * @param {object} urlParams - parameters as per model.router object
   * @returns {undefined}
   */
  async init(urlParams) {
    this.selected = RemoteData.loading();
    this.notify();

    const { objectName, layoutId, objectId, id, ts = undefined } = urlParams;
    const filter = {};
    Object.keys(urlParams)
      .filter((key) => !['page', 'objectName', 'layoutId', 'objectId', 'ts', 'id'].includes(key))
      .forEach((key) => {
        filter[key] = urlParams[key];
      });
    if (objectName) {
      this.updateObjectSelection({ objectName }, ts, id, filter);
    } else if (layoutId && objectId) {
      this.updateObjectSelection({ objectId }, ts, id, filter);
    } else {
      this.selected = RemoteData.failure('Invalid URL parameters provided');
    }
  }

  /**
   * Updates the selected object from ObjectViewModel
   * @param {object} object - object with name or id to be used for content retrieval
   * @param {number} validFrom - timestamp in ms for a specific object
   * @param {string} id - id as per the CCDB storage
   * @param {object} filters - specific fields that should be applied
   * @returns {undefined}
   */
  async updateObjectSelection(object, validFrom = undefined, id = '', filters = this.filter) {
    let { objectName = undefined, objectId = undefined } = object;
    const { objectName: objectNameUrl, objectId: objectIdUrl, layoutId } = this.model.router.params;

    if (!objectName && !objectId && !objectIdUrl && !objectNameUrl && !this.selected.isSuccess()) {
      return;
    } else if (!objectName && !objectId) {
      if (objectIdUrl && layoutId) {
        objectId = objectIdUrl;
      } else if (objectNameUrl) {
        objectName = objectNameUrl;
      } else if (this.selected.isSuccess()) {
        objectName = this.selected.payload.path;
      }
    }
    this.selected = RemoteData.loading();
    this.notify();

    this.filter = filters;
    let currentParams = '?page=objectView';
    if (objectId) {
      currentParams += `&objectId=${encodeURI(objectId)}&layoutId=${encodeURI(layoutId)}`;
      this.selected = await this.model.services.object.getObjectById(objectId, id, validFrom, filters, this);
    } else if (objectName) {
      currentParams += `&objectName=${encodeURI(objectName)}`;
      this.selected = await this.model.services.object.getObjectByName(objectName, id, validFrom, filters, this);
    }
    setBrowserTabTitle(this.selected.payload.name);

    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters)
        .forEach(([key, value]) => {
          currentParams += `&${key}=${encodeURI(value)}`;
        });
    }
    if (validFrom) {
      let path = `${currentParams}&ts=${validFrom}`;
      if (id) {
        path += `&id=${id}`;
      }
      this.model.router.go(path, false, true);
    } else {
      this.model.router.go(`${currentParams}`, false, true);
    }

    this.notify();
  }

  /**
   * Method to allow the addition/update/removal of key;value pairs in filter object
   * @param {string} key - key to look for in filter object
   * @param {string} value - value to update for given key; if none, entry is removed from object
   * @returns {void}
   */
  updateFilterKeyValue(key, value) {
    if (value) {
      this.filter[key] = value;
    } else {
      delete this.filter[key];
    }
  }

  /**
   * Helpers
   */

  /**
   * Return the current state of the filter panel
   * @returns {boolean} - true/false depending on filter being opened/closed
   */
  isFilterVisible() {
    return this._filterVisibility;
  }

  /**
   * Change the state of the visibility of the filter panel
   * @returns {void}
   */
  toggleFilterVisibility() {
    this._filterVisibility = !this._filterVisibility;
    this.notify();
  }
}
