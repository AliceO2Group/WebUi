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

import { NotFoundError } from '@aliceo2/web-ui';
import LayoutRepository from '../database/repositories/LayoutRepository';

/**
 * Store layouts inside JSON based file with atomic write
 */
export class JsonFileService {
  /**
   * Initialize connector by synchronizing DB file and its internal state
   * @param {string} pathname - path to JSON DB file
   */
  constructor(pathname) {
    this.layoutRepository = new LayoutRepository(pathname);
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

    const layout = this.layoutRepository.findLayoutById(newLayout.id);
    if (layout) {
      throw new Error(`layout with this id (${layout.id}) already exists`);
    }
    this.layoutRepository.createLayout(newLayout);
    return newLayout;
  }

  /**
   * Retrieve a layout or undefined
   * @param {string} layoutId - layout id
   * @returns {Layout} - layout object
   * @throws {Error}
   */
  readLayout(layoutId) {
    const layout = this.layoutRepository.findLayoutById(layoutId);
    if (!layout) {
      throw new NotFoundError(`layout (${layoutId}) not found`);
    }
    return layout;
  }

  /**
   * Given a string, representing layout name, retrieve the layout if it exists
   * @param {string} layoutName - name of the layout to retrieve
   * @returns {Layout} - object with layout information
   * @throws
   */
  readLayoutByName(layoutName) {
    const layout = this.layoutRepository.findLayoutByName(layoutName);
    if (!layout) {
      throw new NotFoundError(`Layout (${layoutName}) not found`);
    }
    return layout;
  }

  /**
   * Update a single layout by its id
   * @param {string} layoutId - id of the layout to be updated
   * @param {Layout} data - layout new data
   * @returns {object} Empty details
   */
  updateLayout(layoutId, data) {
    const layout = this.readLayout(layoutId);
    this.layoutRepository.updateLayout(layout, data);
    return layoutId;
  }

  /**
   * Delete a single layout by its id
   * @param {string} layoutId - id of the layout to be removed
   * @returns {object} Empty details
   */
  deleteLayout(layoutId) {
    const layout = this.readLayout(layoutId);
    this.layoutRepository.deleteLayout(layout);
    return layoutId;
  }

  /**
   * List layouts, can be filtered
   * @param {object} filter - accepted keys [owner_id, name]
   * @returns {Array<Layout>} - list of layouts as per the filter
   */
  async listLayouts(filter = {}) {
    return this.layoutRepository.listLayouts(filter);
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
    for (const layout of this.data.layouts) {
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

  /* User helpers */

  /**
   * Check if a user is saved and if not, add it to the in-memory list and db
   * @param {JSON} user - data of the user to be added
   * @returns {undefined}
   */
  addUser(user) {
    this._validateUser(user);
    const isUserPresent = this.data.users
      .findIndex((userEl) => user.id === userEl.id && user.name === userEl.name) !== -1;

    if (!isUserPresent) {
      this.data.users.push(user);
      this._writeToFile();
    }
  }

  /**
   * Validate that a user JSON contains all the mandatory fields
   * @param {JSON} user - data of the user to be added
   * @returns {undefined}
   * @throws {Error}
   */
  _validateUser(user) {
    if (!user) {
      throw new Error('User Object is mandatory');
    }
    if (!user.username) {
      throw new Error('Field username is mandatory');
    }
    if (!user.name) {
      throw new Error('Field name is mandatory');
    }
    if (user.id === null || user.id === undefined || user.id === '') {
      throw new Error('Field id is mandatory');
    }
    if (isNaN(user.id)) {
      throw new Error('Field id must be a number');
    }
  }
}
