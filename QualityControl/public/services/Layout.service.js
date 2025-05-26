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

import { jsonDelete } from './utils/jsonDelete.js';
import { jsonPatch } from './utils/jsonPatch.js';
import { jsonPut } from './utils/jsonPut.js';
import { RemoteData } from '/js/src/index.js';

/**
 * Model namespace with all CRUD requests for layouts
 */
export default class LayoutService {
  /**
   * Initialize model
   * @param {Model} model - root model of the application
   */
  constructor(model) {
    this.model = model;
    this.loader = model.loader;

    this.new = RemoteData.notAsked(); // RemoteData for creating a new layout via modal of import or prompt
    this.update = RemoteData.notAsked(); // RemoteData for updating the JSON file that builds the layout

    this.list = RemoteData.notAsked(); // List of all existing layouts in QCG;
    this.userList = RemoteData.notAsked(); // List of layouts owned by current user;
  }

  /**
   * Method to get all layouts shared between users
   * @param {string|undefined} fields - comma seperated string values. Represent the fields that should be fetched.
   * If left empty all available fields will be fetched
   * @param {Class<Observable>} that - Observer requesting data that should be notified of changes
   * @returns {undefined}
   */
  async getLayouts(fields = undefined, that = this.model) {
    this.list = RemoteData.loading();
    that.notify();

    const url = `/api/layouts${fields !== undefined ? `?fields=${fields}` : ''}`;
    const { result, ok } = await this.loader.get(url);

    if (ok) {
      const username = this.model.session.name;

      const sortedLayouts = result.sort(this._compareByName);
      const officialLayouts = sortedLayouts.filter(({ isOfficial = false }) => isOfficial);
      const userLayouts = sortedLayouts.filter((layout) => layout.owner_name === username);

      this.list = RemoteData.success(sortedLayouts);
      this.model.layoutListModel.folders.get('Official').list = RemoteData.success(officialLayouts);
      this.model.layoutListModel.folders.get('My Layouts').list = RemoteData.success(userLayouts);
    } else {
      this.list = RemoteData.failure(result.error || result.message);
    }
    this.model.layoutListModel.folders.get('All Layouts').list = this.list;

    that.notify();
  }

  /**
   * Method to get all layouts by the user's id
   * @param {string} userId - user id for which to query layouts
   * @param {string|undefined} fields - comma seperated string values. Represent the fields that should be fetched.
   * If left empty all available fields will be fetched
   * @param {Class<Observable>} that - Observer requesting data that should be notified of changes
   * @returns {undefined}
   */
  async getLayoutsByUserId(userId, fields = undefined, that = this.model) {
    this.userList = RemoteData.loading();
    that.notify();

    if (isNaN(userId)) {
      this.userList = RemoteData.failure('Provided userId is not a number');
    } else {
      const url = `/api/layouts?owner_id=${userId}${fields !== undefined ? `&fields=${fields}` : ''}`;

      const { result, ok } = await this.loader.get(url);
      if (ok) {
        const sortedLayouts = result.sort(this._compareByName);
        this.userList = RemoteData.success(sortedLayouts);
        this.model.layoutListModel.folders.get('My Layouts').list = this.userList;
      } else {
        this.userList = RemoteData.failure(result.error || result.message);
        this.model.layoutListModel.folders.get('My Layouts').list = this.userList;
      }
    }

    that.notify();
  }

  /**
   * Comparator function to sort layouts alphabetically by their name property
   * @param {Layout} layout1 - First layout object to compare
   * @param {Layout} layout2 - Second layout object to compare
   * @returns {number} - Returns a number indicating the sort order:
   *   - Negative if layout1.name comes before layout2.name
   *   - Positive if layout1.name comes after layout2.name
   *   - Zero if names are identical
   * @private
   */
  _compareByName(layout1, layout2) {
    return layout1.name.localeCompare(layout2.name);
  }

  /**
   * Method to retrieve a layout by its Id
   * @param {string} layoutId - id of the layout
   * @returns {RemoteData} - result within a RemoteData object
   */
  async getLayoutById(layoutId) {
    const { result, ok } = await this.loader.get(`/api/layout/${layoutId}`);
    return this.parseResult(result, ok);
  }

  /**
   * Method to retrieve a layout by specific parameters as query parameters
   * @param {string} runDefinition - definition of the run
   * @param {string} [pdpBeamType] - optional beam type
   * @returns {Layout} - layout identified if any
   */
  async getLayoutByQuery(runDefinition, pdpBeamType) {
    let url = `/api/layout?runDefinition=${runDefinition}`;
    if (pdpBeamType) {
      url += `&pdpBeamType=${pdpBeamType}`;
    }
    const { result, ok } = await this.loader.get(url);
    return ok ? result : null;
  }

  /**
   * Method to remove a layout by its Id
   * @param {string} layoutId - layout id to be removed by
   * @returns {RemoteData} - result within a RemoteData object
   */
  async removeLayoutById(layoutId) {
    try {
      return RemoteData.success(await jsonDelete(`/api/layout/${layoutId}`));
    } catch (error) {
      return RemoteData.failure(error.message);
    }
  }

  /**
   * Method to save a layout by its Id
   * @param {JSON} layoutItem - layout data to be updated
   * @returns {RemoteData} - result within a RemoteData object
   */
  async saveLayout(layoutItem) {
    const { id } = layoutItem;
    delete layoutItem.isOfficial;

    try {
      return RemoteData.success(await jsonPut(`/api/layout/${id}`, { body: layoutItem }));
    } catch (error) {
      return RemoteData.failure(error.message);
    }
  }

  /**
   * Service method to send a patch HTTP request with new values
   * @param {string} id - ID of layout to patch
   * @param {LayoutPatchDto} patch - object with accepted parameters
   * @returns {Promise<RemoteData>} - response within a RemoteData
   */
  async patchLayout(id, patch) {
    try {
      const response = await jsonPatch(`/api/layout/${id}`, { body: { ...patch } });
      return RemoteData.success(response);
    } catch (error) {
      return RemoteData.failure(error.message);
    }
  }

  /**
   * Method to create a new layout
   * @param {JSON} layout - layout dto representation
   * @param {Class<Observable>} that - class that should be notified about changes in state;
   * Defaults to notifying root class
   * @returns {RemoteData} - result within a RemoteData object
   */
  async createNewLayout(layout, that = this.model) {
    this.new = RemoteData.loading();
    that.notify();

    const { result, ok } = await this.loader.post('/api/layout', layout, true);
    this.new = this.parseResult(result, ok);
    that.notify();

    return this.new;
  }

  /**
   * Method which will return RemoteData object based on the status of the request
   * @param {object} result - value to be added in RemoteData object
   * @param {boolean} ok - whether result was ok or not
   * @returns {RemoteData} - passed result in a RemoteData object
   */
  parseResult(result, ok) {
    if (!ok) {
      return RemoteData.failure(result.error || result.message);
    } else {
      return RemoteData.success(result);
    }
  }
}
