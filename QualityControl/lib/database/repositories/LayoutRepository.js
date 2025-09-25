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

import { BaseRepository } from './BaseRepository.js';
import { Op } from 'sequelize';

/**
 * @typedef {object} LayoutAttributes
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {boolean} display_timestamp
 * @property {number} auto_tab_change_interval
 * @property {string} owner_username
 * @property {boolean} is_official
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * Repository for managing layouts.
 */
export class LayoutRepository extends BaseRepository {
  constructor(layoutModel) {
    super(layoutModel);

    // Build common include structure for all find queries
    this._layoutInfoToInclude = [
      {
        association: 'tabs',
        include: [
          {
            association: 'gridTabCells',
            include: [
              {
                association: 'chart',
                include: [
                  {
                    association: 'chartOptions',
                    include: [{ association: 'option' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        association: 'owner',
        attributes: ['id', 'username', 'name'],
      },
    ];
  }

  /**
   * Finds a layout by its ID
   * @param {string} id id of the layout
   * @returns {Promise<LayoutAttributes|null>}
   */
  async findLayoutById(id) {
    return this.model.findByPk(id, { include: this._layoutInfoToInclude });
  }

  /**
   * Finds all layouts
   * @returns {Promise<LayoutAttributes[]>}
   */
  async findAllLayouts() {
    return this.model.findAll({ include: this._layoutInfoToInclude });
  }

  //TODO: this replaces the listLayouts method
  /**
   * Finds layouts by filters using Op.and and optionally selects specific fields.
   * @param {object[]} filters - Array of Sequelize filter objects
   * @param {string[]} [fields] - Optional array of fields/columns to return
   * @returns {Promise<LayoutAttributes[]>}
   */
  async findLayoustByFilters(filters, fields) {
    return this.model.findAll({
      where: { [Op.and]: filters },
      attributes: fields || undefined, // return all columns if fields not specified
      include: this._layoutInfoToInclude,
    });
  }

  /**
   * Finds layouts by name
   * @param {string} name name of the layout
   * @returns {Promise<LayoutAttributes[]>}
   */
  async findLayoutByName(name) {
    return this.model.findOne({
      where: { name },
      include: this._layoutInfoToInclude,
    });
  }

  /**
   * Creates a new layout
   * @param {Partial<LayoutAttributes>} layoutData new layout
   * @returns {Promise<LayoutAttributes>}
   */
  async createLayout(layoutData) {
    return this.model.create(layoutData);
  }

  /**
   * Updates an existing layout by ID
   * @param {string} id
   * @param {Partial<LayoutAttributes>} updateData updated layout
   * @returns {Promise<number>} Number of updated rows
   */
  async updateLayout(id, updateData) {
    const [updatedCount] = await this.model.update(updateData, { where: { id } });
    return updatedCount;
  }

  /**
   * Deletes a layout by ID
   * @param {string} id id of the layout to delete
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteLayout(id) {
    return this.model.destroy({ where: { id } });
  }
}

// export class LayoutRepository extends BaseRepository {
//   /**
//    * Retrieves a filtered list of layouts with optional field selection
//    * @param {object} [options] - Filtering and field selection options
//    * @param {string} [options.name] - Filter layouts by exact name match
//    * @param {Array<string>} [options.fields] - Array of field names to include in each returned layout object
//    * @param {object} [options.filter] - Filter layouts by containing filter.objectPath, case insensitive
//    * @returns {Array<object>} Array of layout objects matching the filters, containing only the specified fields
//    */
//   listLayouts({ name, fields = [], filter } = {}) {
//     const { layouts } = this._jsonFileService.data;
//     const filteredLayouts = this._filterLayouts(layouts, { ...filter, name });

//     if (fields.length === 0) {
//       return filteredLayouts;
//     }
//     return filteredLayouts.map((layout) => {
//       const layoutObj = {};
//       fields.forEach((field) => {
//         layoutObj[field] = layout[field];
//       });
//       return layoutObj;
//     });
//   }

//   /**
//    * Filters layouts by filter object
//    * @param {Array<object>} layouts - Array of layouts to filter
//    * @param {object} filter - Filtering object
//    * @param {number} [filter.owner_id] - owner id to filter by
//    * @param {string} [filter.name] - name to filter by
//    * @param {string} [filter.objectPath] - object path prefix for potential objects to be contained by layout
//    * @returns {Array<object>} Filtered layouts.
//    */
//   _filterLayouts(layouts, { owner_id, name, objectPath } = {}) {
//     const objectPathLowerCase = objectPath?.toLowerCase();
//     return layouts.filter((layout) => {
//       if (owner_id !== undefined && layout.owner_id !== owner_id) {
//         return false;
//       }
//       if (name !== undefined && layout.name !== name) {
//         return false;
//       }
//       if (objectPathLowerCase) {
//         const hasMatchingObject = layout.tabs?.some((tab) =>
//           tab.objects?.some((obj) =>
//             obj.name?.toLowerCase().includes(objectPathLowerCase)));
//         if (!hasMatchingObject) {
//           return false;
//         }
//       }
//       return true;
//     });
//   }

//   /**
//    * Retrieve a layout by its id or throws an error
//    * @param {string} layoutId - layout id
//    * @returns {Layout} - layout object
//    * @throws {NotFoundError} - if the layout is not found
//    */
//   readLayoutById(layoutId) {
//     const foundLayout = this._jsonFileService.data.layouts.find((layout) => layout.id === layoutId);
//     if (!foundLayout) {
//       throw new NotFoundError(`layout (${layoutId}) not found`);
//     }
//     return foundLayout;
//   }

//   /**
//    * Given a string, representing layout name, retrieve the layout if it exists
//    * @param {string} layoutName - name of the layout to retrieve
//    * @returns {Layout} - object with layout information
//    * @throws
//    */
//   readLayoutByName(layoutName) {
//     const layout = this._jsonFileService.data.layouts.find((layout) => layout.name === layoutName);
//     if (!layout) {
//       throw new NotFoundError(`Layout (${layoutName}) not found`);
//     }
//     return layout;
//   }

//   /**
//    * Create a layout
//    * @param {Layout} newLayout - layout object to be saved
//    * @returns {object} Empty details
//    */
//   async createLayout(newLayout) {
//     if (!newLayout.id) {
//       throw new Error('layout id is mandatory');
//     }
//     if (!newLayout.name) {
//       throw new Error('layout name is mandatory');
//     }

//     const layout = this._jsonFileService.data.layouts.find((layout) => layout.id === newLayout.id);
//     if (layout) {
//       throw new Error(`layout with this id (${layout.id}) already exists`);
//     }
//     this._jsonFileService.data.layouts.push(newLayout);
//     await this._jsonFileService.writeToFile();
//     return newLayout;
//   }

//   /**
//    * Update a single layout by its id
//    * @param {string} layoutId - id of the layout to be updated
//    * @param {LayoutDto} newData - layout new data
//    * @returns {string} id of the layout updated
//    */
//   async updateLayout(layoutId, newData) {
//     const layout = this.readLayoutById(layoutId);
//     Object.assign(layout, newData);
//     await this._jsonFileService.writeToFile();
//     return layoutId;
//   }

//   /**
//    * Delete a single layout by its id
//    * @param {string} layoutId - id of the layout to be removed
//    * @returns {string} id of the layout deleted
//    */
//   async deleteLayout(layoutId) {
//     const layout = this.readLayoutById(layoutId);
//     const index = this._jsonFileService.data.layouts.indexOf(layout);
//     this._jsonFileService.data.layouts.splice(index, 1);
//     await this._jsonFileService.writeToFile();
//     return layoutId;
//   }

//   /**
//    * Return an object by its id that is saved within a layout
//    * @param {string} id - id of the object to retrieve
//    * @returns {{object: object, layoutName: string}} - object configuration stored
//    */
//   getObjectById(id) {
//     if (!id) {
//       throw new Error('Missing mandatory parameter: id');
//     }
//     for (const layout of this._jsonFileService.data.layouts) {
//       for (const tab of layout.tabs) {
//         for (const object of tab.objects) {
//           if (object.id === id) {
//             return { object, layoutName: layout.name, tabName: tab.name };
//           }
//         }
//       }
//     }
//     throw new Error(`Object with ${id} could not be found`);
//   }
// }
