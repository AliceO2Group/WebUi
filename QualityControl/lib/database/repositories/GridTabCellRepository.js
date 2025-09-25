import { BaseRepository } from './BaseRepository.js';

/**
 * @typedef {object} GridTabCellAttributes
 * @property {number} id
 * @property {string} chart_id
 * @property {number} row
 * @property {number} col
 * @property {string} tab_id
 * @property {number} [row_span]
 * @property {number} [col_span]
 * @property {Date} created_at
 * @property {Date} updated_at
 */

/**
 * Repository for managing grid tab cells.
 */
export class GridTabCellRepository extends BaseRepository {
  /**
   * Creates an instance of the GridTabCellRepository class
   * @param {typeof GridTabCell} gridTabCellModel - Sequelize GridTabCell model
   */
  constructor(gridTabCellModel) {
    super(gridTabCellModel);
  }

  /**
   * Finds all grid tab cells by tab ID.
   * @param {string} tabId id of the tab
   * @returns {Promise<GridTabCellAttributes[]>}
   */
  async findByTabId(tabId) {
    return this.model.findAll({ where: { tab_id: tabId } });
  }

  /**
   * Finds all grid tab cells by chart ID.
   * @param {string} chartId id of the chart
   * @returns {Promise<GridTabCellAttributes[]>}
   */
  async findByChartId(chartId) {
    return this.model.findAll({ where: { chart_id: chartId } });
  }

  /**
   * Finds grid tab cells as a plain object by chart ID.
   * @param {string} chartId id of the chart
   * @returns {Promise<object[]>}
   */
  async findObjectByChartId(chartId) {
    const include = [
      {
        association: 'tab',
        include: [{ association: 'layout', attributes: ['name'] }],
        attributes: ['name'],
      },
      {
        association: 'chart',
        include: [
          {
            association: 'chartOptions',
            include: [
              {
                association: 'option',
                attributes: ['name'],
              },
            ],
          },
        ],
        attributes: ['object_name', 'ignore_defaults'],
      },
    ];

    return this.model.findAll({ where: { chart_id: chartId }, include });
  }

  /**
   * Creates a new grid tab cell.
   * @param {Partial<GridTabCellAttributes>} cellData new data
   * @returns {Promise<GridTabCellAttributes>}
   */
  async createGridTabCell(cellData) {
    return this.model.create(cellData);
  }

  /**
   * Updates a grid tab cell by ID.
   * @param {number} id
   * @param {Partial<GridTabCellAttributes>} updateData updated data
   * @returns {Promise<number>} Number of updated rows
   */
  async updateGridTabCell(id, updateData) {
    const [updatedCount] = await this.model.update(updateData, { where: { id } });
    return updatedCount;
  }

  /**
   * Deletes a grid tab cell by ID.
   * @param {number} id
   * @returns {Promise<number>} Number of deleted rows
   */
  async deleteGridTabCell(id) {
    return this.model.destroy({ where: { id } });
  }
}
