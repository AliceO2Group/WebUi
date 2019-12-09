import {h} from '/js/src/index.js';

// Colgroup is a way to put a class on a table column, it has no data to show
// Firefox does not allow 'td' cell width but accepts it with 'col' element
// We use it in 2 tables: the content table and header table
// (both table are distinct to allow content scrolling and fixed header)
export default (model) => h('colgroup', [
  h('col.cell-xs'),
  model.table.colsHeader.date.visible && h(`col.${model.table.colsHeader.date.size}`),
  model.table.colsHeader.time.visible && h(`col.${model.table.colsHeader.time.size}`),
  model.table.colsHeader.hostname.visible && h(`col.${model.table.colsHeader.hostname.size}`),
  model.table.colsHeader.rolename.visible && h(`col.${model.table.colsHeader.rolename.size}`),
  model.table.colsHeader.pid.visible && h(`col.${model.table.colsHeader.pid.size}`),
  model.table.colsHeader.username.visible && h(`col.${model.table.colsHeader.username.size}`),
  model.table.colsHeader.system.visible && h(`col.${model.table.colsHeader.system.size}`),
  model.table.colsHeader.facility.visible && h(`col.${model.table.colsHeader.facility.size}`),
  model.table.colsHeader.detector.visible && h(`col.${model.table.colsHeader.detector.size}`),
  model.table.colsHeader.partition.visible && h(`col.${model.table.colsHeader.partition.size}`),
  model.table.colsHeader.run.visible && h(`col.${model.table.colsHeader.run.size}`),
  model.table.colsHeader.errcode.visible && h(`col.${model.table.colsHeader.errcode.size}`),
  model.table.colsHeader.errline.visible && h(`col.${model.table.colsHeader.errline.size}`),
  model.table.colsHeader.errsource.visible && h(`col.${model.table.colsHeader.errsource.size}`),
  model.table.colsHeader.message.visible && h(`col.${model.table.colsHeader.errsource.size}`),
]);
