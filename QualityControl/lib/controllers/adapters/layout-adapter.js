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

export class LayoutAdapter {
  /**
   * Converts a layout objectto the frontend format,
   * @param {object} layout - The layout object to adapt.
   * @returns {object} - The layout object in frontend format.
   */
  static adaptLayoutForExpressAPI(layout) {
    const layoutAdapted = {
      id: layout.id,
      name: layout.name,
      owner_id: layout.owner.id,
      owner_name: layout.owner.name,
      description: layout.description,
      displayTimestamp: layout.display_timestamp,
      autoTabChange: layout.auto_tab_change_interval,
      tabs: layout.tabs.map((tab) => ({
        id: tab.id,
        name: tab.name,
        columns: tab.column_count,
        objects: tab.gridTabCells.map((cell) => ({
          id: cell.chart.id,
          x: cell.row,
          y: cell.col,
          h: cell.row_span,
          w: cell.col_span,
          name: cell.chart.object_name,
          options: cell.chart.chartOptions.map((chartOption) => ({
            id: chartOption.option.id,
            name: chartOption.option.name,
            type: chartOption.option.type,
          })),
          autoSize: false,
          ignoreDefaults: cell.chart.ignore_defaults || false,
        })),
      })),
      collaborators: [],
    };

    return layoutAdapted;
  }
}
