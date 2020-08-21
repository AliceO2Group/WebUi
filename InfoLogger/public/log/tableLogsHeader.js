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

import {h, iconArrowRight, iconArrowLeft} from '/js/src/index.js';

import tableColGroup from './tableColGroup.js';

export default (model) => h('table.table-logs-header', [
  tableColGroup(model),
  tableBody(model, model.table.colsHeader)
]);


/**
 * Create body of the table
 * @param {Object} model
 * @param {JSON} colsHeader
 * @return {vnode}
 */
const tableBody = (model, colsHeader) =>
  h('tbody', [
    h('tr', [
      h('td.cell.text-ellipsis.cell-xs', {title: 'Severity'}, 'Severity'),
      colsHeader.date.visible && generateCellHeader(model, colsHeader.date, 'Date'),
      colsHeader.time.visible && generateCellHeader(model, colsHeader.time, 'Time'),
      colsHeader.hostname.visible && generateCellHeader(model, colsHeader.hostname, 'Hostname'),
      colsHeader.rolename.visible && generateCellHeader(model, colsHeader.rolename, 'Rolename'),
      colsHeader.pid.visible && generateCellHeader(model, colsHeader.pid, 'PID'),
      colsHeader.username.visible && generateCellHeader(model, colsHeader.username, 'Username'),
      colsHeader.system.visible && generateCellHeader(model, colsHeader.system, 'System'),
      colsHeader.facility.visible && generateCellHeader(model, colsHeader.facility, 'Facility'),
      colsHeader.detector.visible && generateCellHeader(model, colsHeader.detector, 'Detector'),
      colsHeader.partition.visible && generateCellHeader(model, colsHeader.partition, 'Partition'),
      colsHeader.run.visible && generateCellHeader(model, colsHeader.run, 'Run'),
      colsHeader.errcode.visible && generateCellHeader(model, colsHeader.errcode, 'ErrCode'),
      colsHeader.errline.visible && generateCellHeader(model, colsHeader.errline, 'ErrLine'),
      colsHeader.errsource.visible && generateCellHeader(model, colsHeader.errsource, 'ErrSource'),
      colsHeader.message.visible && generateCellHeader(model, colsHeader.message, 'Message'),
    ]),
  ]);
/**
 * Create a cell header with specs
 * @param {Object} model
 * @param {string} cell cell-characteristics
 * @param {string} headerName
 * @return {vnode}
 */
const generateCellHeader = (model, cell, headerName) =>
  h(`td.cell.text-ellipsis.cell-bordered.${cell.size}`, {
    title: headerName
  }, [
    h('span.text-lighter.gray-darker.resizeWidth.br2', {
      title: 'Expand size of cell',
      onclick: () => model.table.setNextSizeOfColumn(cell.size, headerName.toLowerCase())
    }, cell.size === 'cell-xl' ? iconArrowLeft() : iconArrowRight()),
    ' ',
    h('span.ph1', headerName),
  ]);
  // h(`td.cell.text-ellipsis.cell-bordered.cell-m`, headerName);
