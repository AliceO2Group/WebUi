import { BaseRepository } from './BaseRepository.js';

/**
 * @typedef {object} GridTabCellAttributes
 * @property {number} id - auto-incremented ID
 * @property {string} chart_id - ID of the associated chart
 * @property {number} row - position in the grid
 * @property {number} col - position in the grid
 * @property {string} tab_id - ID of the associated tab
 * @property {number} [row_span] - optional row span
 * @property {number} [col_span] - optional column span
 * @property {Date} created_at - timestamp when the record was created
 * @property {Date} updated_at - timestamp when the record was last updated
 */

/**
 * Repository for managing grid tab cells.
 */
export class GridTabCellRepository extends BaseRepository {
  constructor(gridTabCellModel) {
    super(gridTabCellModel);
  }

  /**
   * Finds all grid tab cells by tab ID.
   * @param {string} tabId id of the tab
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<GridTabCellAttributes[]>} List of grid tab cells
   */
  async findByTabId(tabId, options = {}) {
    return this.model.findAll({ where: { tab_id: tabId }, ...options });
  }

  /**
   * Finds grid tab cells as a plain object by chart ID.
   * @param {string} chartId id of the chart
   * @returns {Promise<object[]>} List of grid tab cells with associated tab and chart details
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

    return this.model.findOne({ where: { chart_id: chartId }, include });
  }

  /**
   * Creates a new grid tab cell.
   * @param {Partial<GridTabCellAttributes>} cellData new data
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<GridTabCellAttributes>} Created grid tab cell
   */
  async createGridTabCell(cellData, options = {}) {
    return this.model.create(cellData, { ...options });
  }

  /**
   * Updates a grid tab cell by ID.
   * @param {number} id ID of the grid tab cell to update
   * @param {Partial<GridTabCellAttributes>} updateData updated data
   * @param {object} options additional options for the update (e.g. transaction)
   * @returns {Promise<number>} Number of updated rows
   */
  async updateGridTabCell(id, updateData, options = {}) {
    const { chartId, tabId } = id;
    const [updatedCount] =
      await this.model.update(updateData, { where: { chart_id: chartId, tab_id: tabId }, ...options });
    return updatedCount;
  }
}
