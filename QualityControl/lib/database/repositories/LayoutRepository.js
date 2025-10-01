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

import { InvalidInputError } from '@aliceo2/web-ui';
import { BaseRepository } from './BaseRepository.js';
import { Op, UniqueConstraintError } from 'sequelize';

/**
 * @typedef {object} LayoutAttributes
 * @property {string} id - UUID
 * @property {string} name - unique name of the layout
 * @property {string} [description] - optional description of the layout
 * @property {boolean} display_timestamp - whether to display the timestamp
 * @property {number} auto_tab_change_interval - interval for automatic tab change in seconds
 * @property {string} owner_username - username of the owner
 * @property {boolean} is_official - whether the layout is official
 * @property {Date} created_at - timestamp when the layout was created
 * @property {Date} updated_at - timestamp when the layout was last updated
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
   * @returns {Promise<LayoutAttributes|null>} Layout found or null
   */
  async findLayoutById(id) {
    return this.model.findByPk(id, { include: this._layoutInfoToInclude });
  }

  /**
   * Finds layouts
   * @returns {Promise<LayoutAttributes[]>} Array of layouts found
   */
  async findAllLayouts() {
    return this.model.findAll({
      include: this._layoutInfoToInclude,
    });
  }

  /**
   * Finds layouts by filters using Op.and and optionally selects specific fields.
   * @param {object} filters key-value pairs to filter the layouts
   * @param {string} [filters.objectPath] optional object path to filter charts
   * @returns {Promise<LayoutAttributes[]>} Array of layouts found
   */
  async findLayoutsByFilters({ objectPath, ...filters }) {
    const include = [...this._layoutInfoToInclude];
    const [tabsInclude] = include;
    const [gridTabCellsInclude] = tabsInclude.include;
    const [chartInclude] = gridTabCellsInclude.include;
    if (objectPath) {
      const objectPathLower = objectPath.toLowerCase();
      chartInclude.required = true;
      chartInclude.where = {
        object_name: { [Op.iLike]: `%${objectPathLower}%` },
      };
    }
    return this.model.findAll({
      where: filters,
      include,
    });
  }

  /**
   * Finds layouts by name
   * @param {string} name name of the layout
   * @returns {Promise<LayoutAttributes[]>} Array of layouts found
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
   * @param {object} options Sequelize create options (e.g. transaction)
   * @returns {Promise<LayoutAttributes>} The created layout
   * @throws {InvalidInputError} If a layout with the same unique fields (e.g., name) already exists
   * @throws {Error} If an error occurs creating the layout
   */
  async createLayout(layoutData, options = {}) {
    try {
      const newLayout = await this.model.create(layoutData, { ...options });
      return newLayout;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const field = error.errors?.[0]?.path || 'name';
        throw new InvalidInputError(`A layout with the same ${field} already exists.`);
      }
      throw error;
    }
  }

  /**
   * Updates an existing layout by ID
   * @param {string} id id of the layout to update
   * @param {Partial<LayoutAttributes>} updateData updated layout
   * @param {object} options Sequelize update options (e.g. transaction)
   * @returns {Promise<number>} Number of updated rows
   */
  async updateLayout(id, updateData, options = {}) {
    try {
      const [updatedCount] = await this.model.update(updateData, { where: { id }, ...options });
      return updatedCount;
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        const field = error.errors?.[0]?.path || 'name';
        throw new InvalidInputError(`A layout with the same ${field} already exists.`);
      }
      throw error;
    }
  }

  /**
   * Deletes a layout by ID
   * @param {string} id Id of the layout to delete
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteLayout(id) {
    return this.model.destroy({ where: { id } });
  }
}
