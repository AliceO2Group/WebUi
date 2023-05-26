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
  }

  /**
   * Updates the selected object from ObjectViewModel
   * @param {object} object - object with name or id to be used for content retrieval
   * @param {number} timestamp - timestamp in ms for a specific object
   * @param {object} filter - specific fields that should be applied
   * @returns {undefined}
   */
  async updateObjectSelection({ objectName = undefined, objectId = undefined }, timestamp = undefined, filter = {}) {
    if (!objectName && !objectId && !this.selected.isSuccess()) {
      return;
    } else if (!objectName && !objectId) {
      objectName = this.selected.payload.path;
    }
    this.selected = RemoteData.loading();
    this.notify();

    this.filter = filter;
    const filterAsString = Object.keys(filter).map((key) => `${key}=${this.filter[key]}`).join('/');

    if (objectId) {
      this.selected = await this.model.services.object.getObjectById(objectId, timestamp, filterAsString, this);
    } else if (objectName) {
      this.selected = await this.model.services.object.getObjectByName(objectName, timestamp, filterAsString, this);
    }
    setBrowserTabTitle(this.selected.payload.name);
    if (timestamp) {
      let currentParams = '?page=objectView';
      Object.entries(this.model.router.params)
        .filter(([key, value]) => value && key !== 'ts' && key !== 'page')
        .forEach(([key, value]) => {
          currentParams += `&${key}=${encodeURI(value)}`;
        });
      this.model.router.go(`${currentParams}&ts=${timestamp}`, false, true);
    }

    this.notify();
  }

  /**
   * Method to initialize page data
   * @param {object} urlParams - parameters as per model.router object
   * @returns {undefined}
   */
  async init(urlParams) {
    this.selected = RemoteData.loading();
    this.notify();

    const { objectName, layoutId, objectId, ts = undefined } = urlParams;

    if (objectName) {
      this.updateObjectSelection({ objectName }, ts, {});
    } else if (layoutId && objectId) {
      this.updateObjectSelection({ objectId }, ts, {});
    } else {
      this.selected = RemoteData.failure('Invalid URL parameters provided');
    }
  }
}
