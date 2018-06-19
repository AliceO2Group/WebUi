import {h} from '/js/src/index.js';

export default (item) => h('table.table', [
  h('tbody', Object.keys(item).map((columnName) => h('tr', [
    h('th', columnName),
    h('td', item[columnName]),
  ]))),
]);
