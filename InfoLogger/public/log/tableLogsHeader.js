import {h, iconArrowRight, iconArrowLeft} from '/js/src/index.js';

import tableColGroup from './tableColGroup.js';

export default (model) => h('table.table-logs-header', [
  tableColGroup(model),
  h('tbody', [
    h('tr', [
      h('td.cell.text-ellipsis.cell-xs', {title: 'Severity'}, 'Severity'),
      model.table.colsHeader.date.visible && generateCellHeader(model, model.table.colsHeader.date, 'Date'),
      model.table.colsHeader.time.visible && generateCellHeader(model, model.table.colsHeader.time, 'Time'),
      model.table.colsHeader.hostname.visible && generateCellHeader(model, model.table.colsHeader.hostname, 'Hostname'),
      model.table.colsHeader.rolename.visible && generateCellHeader(model, model.table.colsHeader.rolename, 'Rolename'),
      model.table.colsHeader.pid.visible && generateCellHeader(model, model.table.colsHeader.pid, 'PID'),
      model.table.colsHeader.username.visible && generateCellHeader(model, model.table.colsHeader.username, 'Username'),
      model.table.colsHeader.system.visible && generateCellHeader(model, model.table.colsHeader.system, 'System'),
      model.table.colsHeader.facility.visible && generateCellHeader(model, model.table.colsHeader.facility, 'Facility'),
      model.table.colsHeader.detector.visible && generateCellHeader(model, model.table.colsHeader.detector, 'Detector'),
      model.table.colsHeader.partition.visible && generateCellHeader(model, model.table.colsHeader.partition, 'Partition'),
      model.table.colsHeader.run.visible && generateCellHeader(model, model.table.colsHeader.run, 'Run'),
      model.table.colsHeader.errcode.visible && generateCellHeader(model, model.table.colsHeader.errcode, 'ErrCode'),
      model.table.colsHeader.errline.visible && generateCellHeader(model, model.table.colsHeader.errline, 'ErrLine'),
      model.table.colsHeader.errsource.visible && generateCellHeader(model, model.table.colsHeader.errsource, 'ErrSource'),
      model.table.colsHeader.message.visible && generateCellHeader(model, model.table.colsHeader.message, 'Message'),
    ]),
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
