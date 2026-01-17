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

import { NotFoundError } from '@aliceo2/web-ui';
import { BaseRepository } from './BaseRepository.js';

/**
 * LayoutRepository class to handle CRUD operations for Layouts.
 */
export class LayoutRepository extends BaseRepository {
  /**
   * Retrieves a filtered list of layouts with optional field selection
   * @param {object} [options] - Filtering and field selection options
   * @param {string} [options.name] - Filter layouts by exact name match
   * @param {Array<string>} [options.fields] - Array of field names to include in each returned layout object
   * @param {object} [options.filter] - Filter layouts by containing filter.objectPath, case insensitive
   * @returns {Array<object>} Array of layout objects matching the filters, containing only the specified fields
   */
  listLayouts({ name, fields, filter } = {}) {
    const { layouts } = this._jsonFileService.data;
    const filteredLayouts = this._filterLayouts(layouts, { ...filter, name });

    const trimmedAndLabelledLayouts = filteredLayouts
      .map((layout) => this._trimAndLabelLayout(layout, fields));
    return trimmedAndLabelledLayouts;
  }

  /**
   * Adds labels field to a layout based on contained objects in the layout tabs.
   * Then, trims a layout object to only include requested fields and adds labels
   * @param {object} layout - layout object to be processed
   * @param {Array<string>} fields - Array of field names to include in the returned layout object
   * @returns {object} - Processed layout object with added labels and trimmed fields
   */
  _trimAndLabelLayout(layout, fields) {
    const labeledLayout = this._addLabelsToLayout(layout);
    const trimmedLayout = this._trimLayout(labeledLayout, fields);
    return trimmedLayout;
  }

  /**
   * Trims a layout object to only include requested fields
   * @param {object} layout - layout object to be trimmed
   * @param {Array<string>} [fields = []] - Array of field names to include in the returned layout object
   * @returns {object} - Trimmed layout object
   */
  _trimLayout(layout, fields = []) {
    if (fields.length === 0) {
      return layout;
    }
    const trimmedLayout = {};
    for (const field of fields) {
      if (field in layout) {
        trimmedLayout[field] = layout[field];
      }
    }
    return trimmedLayout;
  }

  /**
   * Method to identify the unique prefix (encountering first '/') of objects and add it as a set of labels to layout
   * @param {object} layout - layout object to which labels will be added
   * @returns {object} - layout object with added labels
   */
  _addLabelsToLayout(layout) {
    const labelsSet = new Set();
    layout.tabs?.forEach((tab) => {
      tab.objects?.forEach((obj) => {
        if (obj.name) {
          const [prefix] = obj.name.split('/');
          labelsSet.add(prefix);
        }
      });
    });
    return { ...layout, labels: Array.from(labelsSet) };
  }

  /**
   * Filters layouts by filter object
   * @param {Array<object>} layouts - Array of layouts to filter
   * @param {object} filter - Filtering object
   * @param {number} [filter.owner_id] - owner id to filter by
   * @param {string} [filter.name] - name to filter by
   * @param {string} [filter.objectPath] - object path prefix for potential objects to be contained by layout
   * @returns {Array<object>} Filtered layouts.
   */
  _filterLayouts(layouts, { owner_id, name, objectPath } = {}) {
    const objectPathLowerCase = objectPath?.toLowerCase();
    return layouts.filter((layout) => {
      if (owner_id !== undefined && layout.owner_id !== owner_id) {
        return false;
      }
      if (name !== undefined && layout.name !== name) {
        return false;
      }
      if (objectPathLowerCase) {
        const hasMatchingObject = layout.tabs?.some((tab) =>
          tab.objects?.some((obj) =>
            obj.name?.toLowerCase().includes(objectPathLowerCase)));
        if (!hasMatchingObject) {
          return false;
        }
      }
      return true;
    });
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
