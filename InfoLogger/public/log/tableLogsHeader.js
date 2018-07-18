import {h} from '/js/src/index.js';

import tableColGroup from './tableColGroup.js';

export default (model) => h('table.table-logs-header', [
  tableColGroup(model),
  h('tbody', [
    h('tr', [
      h('td.cell.text-ellipsis.cell-xs', 'Severity'),
      model.log.columns.date && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Date'),
      model.log.columns.time && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Time'),
      model.log.columns.hostname && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Hostname'),
      model.log.columns.rolename && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Rolename'),
      model.log.columns.pid && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'PID'),
      model.log.columns.username && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Username'),
      model.log.columns.system && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'System'),
      model.log.columns.facility && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Facility'),
      model.log.columns.detector && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'Detector'),
      model.log.columns.partition && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'Partition'),
      model.log.columns.run && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'Run'),
      model.log.columns.errcode && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'ErrCode'),
      model.log.columns.errline && h('td.cell.text-ellipsis.cell-bordered.cell-s', 'ErrLine'),
      model.log.columns.errsource && h('td.cell.text-ellipsis.cell-bordered.cell-m', 'ErrSource'),
      model.log.columns.message && h('td.cell.text-ellipsis.cell-bordered', 'Message'),
    ]),
  ]),
]);
