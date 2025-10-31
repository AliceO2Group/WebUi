import { BaseRepository } from './BaseRepository.js';

/**
 * @typedef {object} GridTabCellAttributes
 * @property {number} id - auto-incremented ID
 * @property {string} chart_id - ID of the associated chart
 * @property {number} row - position in the grid
 * @property {number} col - position in the grid
 * @property {number} tab_id - ID of the associated tab
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
   * @param {number} tabId id of the tab
   * @param {object} options additional options for the query (e.g. transaction)
   * @returns {Promise<GridTabCellAttributes[]>} List of grid tab cells
   */
  async findByTabId(tabId, options = {}) {
    return super.findAll({ where: { tab_id: tabId }, ...options });
  }

  /**
   * Finds grid tab cells as a plain object by chart ID.
   * @param {number} chartId id of the chart
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
    return super.findOne({ chart_id: chartId }, { include });
  }
}
