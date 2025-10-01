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
   * Transforms a backend layout object into the format
   * expected by the Express API frontend.
   * @param {object} layout Adapted layout object in frontend format.
   * @param {string[]} [fields] Optional list of fields to include in the returned object.
   * @returns {object} The layout object in frontend format.
   * @throws {Error} If the layout cannot be adapted.
   */
  static adaptLayoutForExpressAPI(layout, fields) {
    try {
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
            x: cell.col || 0,
            y: cell.row || 0,
            h: cell.row_span || 1,
            w: cell.col_span || 1,
            name: cell.chart.object_name,
            options: cell.chart.chartOptions.map((chartOption) => chartOption.option.name),
            autoSize: false,
            ignoreDefaults: cell.chart.ignore_defaults || false,
          })),
        })),
        isOfficial: layout.is_official,
        collaborators: [],
      };
      if (Array.isArray(fields) && fields.length > 0) {
        const filteredLayout = {};
        for (const field of fields) {
          if (field in layoutAdapted) {
            filteredLayout[field] = layoutAdapted[field];
          }
        }
        return filteredLayout;
      }

      return layoutAdapted;
    } catch (error) {
      throw new Error(`Error adapting layout: ${error.message}`);
    }
  }
}
