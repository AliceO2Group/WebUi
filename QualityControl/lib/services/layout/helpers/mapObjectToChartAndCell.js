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

import { InvalidInputError } from '@aliceo2/web-ui';

/**
 * Maps an input object to a chart and a cell
 * @param {object} object - The input object
 * @param {string} tabId - The ID of the tab
 * @returns {object} An object containing the mapped chart and cell
 */
export function mapObjectToChartAndCell(object, tabId) {
  if (!object || typeof object !== 'object' || !tabId) {
    throw new InvalidInputError('Invalid input: object and tab id are required');
  }
  const { id: chartId, x, y, h, w, name, ignoreDefaults } = object;

  return {
    chart: {
      id: chartId,
      object_name: name,
      ignore_defaults: ignoreDefaults,
    },
    cell: {
      tab_id: tabId,
      chart_id: chartId,
      row: x,
      col: y,
      row_span: h,
      col_span: w,
    },
  };
}
