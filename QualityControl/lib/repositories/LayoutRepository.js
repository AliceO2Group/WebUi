/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import assert from 'assert';

/**
 * @typedef {import('../services/JsonFileService.js').JsonFileService} JsonFileService
 */

import { NotFoundError } from '@aliceo2/web-ui';

/**
 * LayoutRepository class to handle CRUD operations for Layouts.
 */
export class LayoutRepository {
  /**
   * Initializes the LayoutRepository.
   * @param {JsonFileService} jsonFileService - Service to interact with the JSON database.
   * @throws {Error} Throws an error if jsonFileService is not provided.
   */
  constructor(jsonFileService) {
    assert(jsonFileService, 'Missing service for retrieving layout data');

    /**
     * JSON service to handle data storage.
     * @type {JsonFileService}
     * @private
     */
    this._jsonFileService = jsonFileService;
  }

  /**
   * List layouts, can be filtered
   * @param {object} filter - accepted keys [owner_id, name]
   * @returns {Array<Layout>} - list of layouts as per the filter
   */
  listLayouts(filter = {}) {
    return this._jsonFileService.data.layouts.filter((layout) =>
      (filter.owner_id === undefined || layout.owner_id === filter.owner_id)
            && (filter.name === undefined || layout.name === filter.name));
  }

  /**
   * Retrieve a layout by its id or throws an error
   * @param {string} layoutId - layout id
   * @returns {Layout} - layout object
   * @throws {NotFoundError} - if the layout is not found
   */
  readLayoutById(layoutId) {
    const foundLayout = this._jsonFileService.data.layouts.find((layout) => layout.id === layoutId);
    if (!foundLayout) {
      throw new NotFoundError(`layout (${layoutId}) not found`);
    }
    return foundLayout;
  }

  /**
   * Given a string, representing layout name, retrieve the layout if it exists
   * @param {string} layoutName - name of the layout to retrieve
   * @returns {Layout} - object with layout information
   * @throws
   */
  readLayoutByName(layoutName) {
    const layout = this._jsonFileService.data.layouts.find((layout) => layout.name === layoutName);
    if (!layout) {
      throw new NotFoundError(`Layout (${layoutName}) not found`);
    }
    return layout;
  }

  /**
   * Create a layout
   * @param {Layout} newLayout - layout object to be saved
   * @returns {object} Empty details
   */
  async createLayout(newLayout) {
    if (!newLayout.id) {
      throw new Error('layout id is mandatory');
    }
    if (!newLayout.name) {
      throw new Error('layout name is mandatory');
    }

    const layout = this._jsonFileService.data.layouts.find((layout) => layout.id === newLayout.id);
    if (layout) {
      throw new Error(`layout with this id (${layout.id}) already exists`);
    }
    this._jsonFileService.data.layouts.push(newLayout);
    await this._jsonFileService.writeToFile();
    return newLayout;
  }

  /**
   * Update a single layout by its id
   * @param {string} layoutId - id of the layout to be updated
   * @param {LayoutDto} newData - layout new data
   * @returns {string} id of the layout updated
   */
  async updateLayout(layoutId, newData) {
    const layout = this.readLayoutById(layoutId);
    Object.assign(layout, newData);
    await this._jsonFileService.writeToFile();
    return layoutId;
  }

  /**
   * Delete a single layout by its id
   * @param {string} layoutId - id of the layout to be removed
   * @returns {string} id of the layout deleted
   */
  async deleteLayout(layoutId) {
    const layout = this.readLayoutById(layoutId);
    const index = this._jsonFileService.data.layouts.indexOf(layout);
    this._jsonFileService.data.layouts.splice(index, 1);
    await this._jsonFileService.writeToFile();
    return layoutId;
  }

  /**
   * Return an object by its id that is saved within a layout
   * @param {string} id - id of the object to retrieve
   * @returns {{object: object, layoutName: string}} - object configuration stored
   */
  getObjectById(id) {
    if (!id) {
      throw new Error('Missing mandatory parameter: id');
    }
    for (const layout of this._jsonFileService.data.layouts) {
      for (const tab of layout.tabs) {
        for (const object of tab.objects) {
          if (object.id === id) {
            return { object, layoutName: layout.name, tabName: tab.name };
          }
        }
      }
    }
    throw new Error(`Object with ${id} could not be found`);
  }
}
