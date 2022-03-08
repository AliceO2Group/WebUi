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

import {assertLayouts} from '../common/Types.js';
import {fetchClient, RemoteData} from '/js/src/index.js';

/**
 * Model namespace with all CRUD requests for layouts
 */
export default class LayoutService {
  /**
   * Initialize model
   * @param {Object} loader
   */
  constructor(loader) {
    this.loader = loader;
  }

  /**
   * Method to get all layouts shared between users
   * @return {RemoteData}
   */
  async getLayouts() {
    const {result, ok} = await this.loader.get('/api/layouts');
    return this.parseResult(result, ok);
  }

  /**
   * Method to get all layouts by the user's id
   * @param {string} userId
   * @return {RemoteData}
   */
  async getLayoutsByUserId(userId) {
    console.log(userId)
    const {result, ok} = await this.loader.get(`/api/layouts?owner_id=${userId}`);
    if (!ok) {
      return RemoteData.failure(result.error);
    } else {
      return RemoteData.success(assertLayouts(result));
    }
  }

  /**
   * Method to retrieve a layout by its Id
   * @param {string} layoutId
   */
  async getLayoutById(layoutId) {
    const {result, ok} = await this.loader.get(`/api/layout/${layoutId}`);
    return this.parseResult(result, ok);
  }

  /**
   * Method to remove a layout by its Id
   * @param {string} layoutId
   */
  async removeLayoutById(layoutId) {
    const request = fetchClient(`/api/layout/${layoutId}`, {method: 'DELETE'});
    this.loader.watchPromise(request);
    await request;
  }

  /**
   * Method to save a layout by its Id
   * @param {JSON} layoutItem
   * @return {RemoteData}
   */
  async saveLayout(layoutItem) {
    const {result, ok} = await this.loader.post(`/api/writeLayout?layoutId=${layoutItem.id}`, layoutItem);
    return this.parseResult(result, ok);
  }

  /**
   * Method to create a new layout
   * @param {JSON} layout
   * @return {RemoteData}
   */
  async createNewLayout(layout) {
    const {result, ok} = await this.loader.post('/api/layout', layout);
    return this.parseResult(result, ok);
  }

  /**
   * Method which will return RemoteData object based on the status of the request
   * @param {Object} result
   * @param {boolean} ok
   * @return {RemoteData}
   */
  parseResult(result, ok) {
    if (!ok) {
      return RemoteData.failure(result.error || result.message);
    } else {
      return RemoteData.success(result);
    }
  }
}
