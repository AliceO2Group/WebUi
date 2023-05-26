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

import { fetchClient, RemoteData } from '/js/src/index.js';

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

    this.list = RemoteData.notAsked(); // List of all existing layouts in QCG;
    this.userList = RemoteData.notAsked(); // List of layouts owned by current user;
  }

  /**
   * Method to get all layouts shared between users
   * @param {Class<Observable>} that - Observer requesting data that should be notified of changes
   * @returns {undefined}
   */
  async getLayouts(that = this.model) {
    this.list = RemoteData.loading();
    that.notify();

    const { result, ok } = await this.loader.get('/api/layouts');

    if (ok) {
      const sortedLayouts = result.sort((lOne, lTwo) => lOne.name > lTwo.name ? 1 : -1);
      this.list = RemoteData.success(sortedLayouts);
      this.model.folder.map.get('All Layouts').list = RemoteData.success(sortedLayouts);
    } else {
      this.list = RemoteData.failure(result.error || result.message);
      this.model.folder.map.get('All Layouts').list = RemoteData.failure(result.error || result.message);
    }

    that.notify();
  }

  /**
   * Method to get all layouts by the user's id
   * @param {string} userId - user id for which to query layouts
   * @param {Class<Observable>} that - Observer requesting data that should be notified of changes
   * @returns {undefined}
   */
  async getLayoutsByUserId(userId, that = this.model) {
    this.userList = RemoteData.loading();
    that.notify();

    if (isNaN(userId)) {
      this.userList = RemoteData.failure('Provided userId is not a number');
    } else {
      const { result, ok } = await this.loader.get(`/api/layouts?owner_id=${userId}`);
      if (ok) {
        const sortedLayouts = result.sort((lOne, lTwo) => lOne.name > lTwo.name ? 1 : -1);
        this.userList = RemoteData.success(sortedLayouts);
        this.model.folder.map.get('My Layouts').list = RemoteData.success(sortedLayouts);
      } else {
        this.userList = RemoteData.failure(result.error || result.message);
        this.model.folder.map.get('My Layouts').list = RemoteData.failure(result.error || result.message);
      }
    }

    that.notify();
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
   * Method to remove a layout by its Id
   * @param {string} layoutId - layout id to be removed by
   * @returns {RemoteData} - result within a RemoteData object
   */
  async removeLayoutById(layoutId) {
    const request = fetchClient(`/api/layout/${layoutId}`, { method: 'DELETE' });
    this.loader.watchPromise(request);
    await request;
  }

  /**
   * Method to save a layout by its Id
   * @param {JSON} layoutItem - layout data to be updated
   * @returns {RemoteData} - result within a RemoteData object
   */
  async saveLayout(layoutItem) {
    const { result, ok } = await this.loader.post(`/api/writeLayout?id=${layoutItem.id}`, layoutItem, true);
    return this.parseResult(result, ok);
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

    this.new = ok ? RemoteData.success(result) : RemoteData.failure({ message: result.error || result.message });
    that.notify();

    return this.parseResult(result, ok);
  }

  /**
   * Method which will return RemoteData object based on the status of the request
   * @param {Object} result - value to be added in RemoteData object
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
