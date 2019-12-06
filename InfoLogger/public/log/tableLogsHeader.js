import {h} from '/js/src/index.js';

import tableColGroup from './tableColGroup.js';

export default (model) => h('table.table-logs-header', [
  tableColGroup(model),
  h('tbody', [
    h('tr', [
      h('td.cell.text-ellipsis.cell-xs', 'Severity'),
      model.log.columns.date && generateCellHeader(model, model.table.colsHeader.date, 'Date'),
      model.log.columns.time && generateCellHeader(model, model.table.colsHeader.time, 'Time'),
      model.log.columns.hostname && generateCellHeader(model, model.table.colsHeader.hostname, 'Hostname'),
      model.log.columns.rolename && generateCellHeader(model, model.table.colsHeader.rolename, 'Rolename'),
      model.log.columns.pid && generateCellHeader(model, model.table.colsHeader.pid, 'PID'),
      model.log.columns.username && generateCellHeader(model, model.table.colsHeader.username, 'Username'),
      model.log.columns.system && generateCellHeader(model, model.table.colsHeader.system, 'System'),
      model.log.columns.facility && generateCellHeader(model, model.table.colsHeader.facility, 'Facility'),
      model.log.columns.detector && generateCellHeader(model, model.table.colsHeader.detector, 'Detector'),
      model.log.columns.partition && generateCellHeader(model, model.table.colsHeader.partition, 'Partition'),
      model.log.columns.run && generateCellHeader(model, model.table.colsHeader.run, 'Run'),
      model.log.columns.errcode && generateCellHeader(model, model.table.colsHeader.errCode, 'ErrCode'),
      model.log.columns.errline && generateCellHeader(model, model.table.colsHeader.errLine, 'ErrLine'),
      model.log.columns.errsource && generateCellHeader(model, model.table.errSource, 'ErrSource'),
      model.log.columns.message && generateCellHeader(model, model.table.message, 'Message'),
    ]),
  ]),
]);

/**
 * Create a cell header with specs
 * @param {Object} model
 * @param {string} cellSpecs cell-characteristics
 * @param {string} headerName
 * @return {vnode}
 */
const generateCellHeader = (model, cellSpecs, headerName) =>
  h(`td.cell.text-ellipsis.cell-bordered.${cellSpecs.size}`, headerName);
