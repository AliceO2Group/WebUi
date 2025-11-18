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

import { BaseViewModel } from '../../common/abstracts/BaseViewModel.js';
import { setBrowserTabTitle } from '../../common/utils.js';
import { RemoteData, BrowserStorage } from '/js/src/index.js';

/**
 * Model namespace for ObjectViewPage
 */
export default class ObjectViewModel extends BaseViewModel {
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

    this._storage = new BrowserStorage('object-view-info-visibility-setting');
    this._loadObjectInfoVisible();
  }

  /**
   * Method to initialize page data
   * @param {object} urlParams - parameters as per model.router object
   * @returns {undefined}
   */
  async init(urlParams) {
    const { objectName, layoutId, objectId, id, ts = undefined } = urlParams;
    if (objectName) {
      this.updateObjectSelection({ objectName }, ts, id);
    } else if (layoutId && objectId) {
      this.updateObjectSelection({ objectId }, ts, id);
    } else {
      this.selected = RemoteData.failure('Invalid URL parameters provided');
    }
  }

  /**
   * Updates the selected object from ObjectViewModel
   * @param {object} object - object with name or id to be used for content retrieval
   * @param {number} validFrom - timestamp in ms for a specific object
   * @param {string} id - id as per the CCDB storage
   * @returns {undefined}
   */
  async updateObjectSelection(object, validFrom = undefined, id = '') {
    const { objectName = undefined, objectId = undefined } = object;
    const { params } = this.model.router;
    const context = { objectName: objectName || params.objectName, objectId: objectId || params.objectId };
    const { refreshNeeded, data } = await this.model.object.checkIfRefreshObject(this.selected.payload, context);
    if (!refreshNeeded) {
      return;
    }

    this._setParameters(objectName, objectId, params);
    this.selected = RemoteData.loading();
    this.notify();

    if (!objectName && !objectId && !params.objectId && !params.objectName && !this.selected.isSuccess()) {
      return; // This will permanently put the page in loading mode.
    }

    let currentParams = '?page=objectView';

    // Use refreshed data if available, otherwise fetch based on available parameters
    if (data) {
      this.selected = data;
    } else if (params.objectName) {
      this.selected = await this.model.services.object.getObjectByName(params.objectName, id, validFrom, this);
    } else if (params.objectId) {
      this.selected = await this.model.services.object.getObjectById(params.objectId, id, validFrom, this);
    }

    setBrowserTabTitle(this.selected.payload.name);

    Object.entries(params).forEach(([key, value]) => {
      currentParams += `&${key}=${encodeURI(value)}`;
    });

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
   * Creates the href url for the download element
   * @param {string} objectId - id of root object
   * @returns {string|void} download link
   */
  getDownloadQcdbObjectUrl(objectId = undefined) {
    if (objectId == undefined || this.model.session.token == undefined) {
      return;
    }
    return `/api/object/proxy/download/?token=${this.model.session.token}&objectIds=${objectId}`;
  }

  /**
   * Get the current display state of object information from the local storage.
   * If the value does not exist in storage, or if the stored value has been tampered
   * with and is invalid, this method will default to `true` (object information is visible).
   * This method **sets `_objectInfoVisible` directly** without notifying any observers.
   */
  _loadObjectInfoVisible() {
    try {
      this._objectInfoVisible = this._storage.getLocalItem(this.model.session.personid.toString()) ?? true;
      // eslint-disable-next-line no-unused-vars
    } catch (_) {
      this._storage.removeLocalItem(this.model.session.personid.toString());
      this._objectInfoVisible = true;
    }
  }

  /**
   * Get the current display state of object information.
   * @returns {boolean} - `true` if object information is currently displayed, `false` otherwise.
   */
  get objectInfoVisible() {
    return this._objectInfoVisible;
  }

  /**
   * Toggle the display state of object information and store it in the local storage.
   * If currently visible, it becomes hidden; if hidden, it becomes visible.
   */
  toggleObjectInfoVisible() {
    this._objectInfoVisible = !this._objectInfoVisible;
    this._storage.setLocalItem(this.model.session.personid.toString(), this._objectInfoVisible);
    this.notify();
  }

  /**
   * Sets routing parameters for object retrieval based on the available information.
   * Ensures only one of objectName or objectId is set, and removes irrelevant keys.
   * @param {string|undefined} objectName - Name of the object, if available.
   * @param {string|undefined} objectId - ID of the object, if available.
   * @param {object} params - The router parameters object to be updated in-place.
   * @returns {void}
   */
  _setParameters(objectName, objectId, params) {
    delete params.page; // page, ts and id are set manually
    delete params.ts;
    delete params.id;

    // The priority is as follows: provided name/id, name/id already in params, name from the selected object
    if (objectId) {
      delete params.objectName;
      params.objectId = objectId;
    } else if (objectName) {
      this._setObjectName(params, objectName);
    } else if (params.objectId) {
      delete params.objectName;
    } else if (params.objectName) {
      this._setObjectName(params, params.objectName /* only removes layoutId and ObjectId from params */);
    } else if (this.selected.isSuccess()) {
      this._setObjectName(params, this.selected.payload.path);
    }
  }

  /**
   * Sets the objectName in parameters and removes conflicting keys.
   * @param {object} params - The router parameters object to be updated in-place.
   * @param {string} name - The object name to set in the parameters.
   * @returns {void}
   */
  _setObjectName(params, name) {
    delete params.objectId;
    delete params.layoutId;
    params.objectName = name;
  };

  /**
   * Wrapper function for updateObjectSelection that will be triggered by filterModel;
   */
  async triggerFilter() {
    await this.init(this.model.router.params);
  }
}
