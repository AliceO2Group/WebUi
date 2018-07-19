import {h} from '/js/src/index.js';

// Colgroup is a way to put a class on a table column, it has no data to show
// Firefox does not allow 'td' cell width but accepts it with 'col' element
// We use it in 2 tables: the content table and header table
// (both table are distinct to allow content scrolling and fixed header)
export default (model) => h('colgroup', [
  h('col.cell-xs'),
  model.log.columns.date && h('col.cell-m'),
  model.log.columns.time && h('col.cell-m'),
  model.log.columns.hostname && h('col.cell-m'),
  model.log.columns.rolename && h('col.cell-m'),
  model.log.columns.pid && h('col.cell-s'),
  model.log.columns.username && h('col.cell-m'),
  model.log.columns.system && h('col.cell-s'),
  model.log.columns.facility && h('col.cell-m'),
  model.log.columns.detector && h('col.cell-s'),
  model.log.columns.partition && h('col.cell-m'),
  model.log.columns.run && h('col.cell-s'),
  model.log.columns.errcode && h('col.cell-s'),
  model.log.columns.errline && h('col.cell-s'),
  model.log.columns.errsource && h('col.cell-m'),
  model.log.columns.message && h('col.cell-l'),
]);
