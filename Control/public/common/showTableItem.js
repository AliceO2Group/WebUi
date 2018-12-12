import {h} from '/js/src/index.js';

/**
 * Generic table to show properties of an object
 * This can be forked to show more specific data (format date, colors, more buttons...)
 * @param {Object} item - object to be shown
 * @return {vnode} table view
 */
export default (item) => h('table.table', [
  h('tbody', Object.keys(item).map((columnName) => h('tr', [
    h('th', columnName),
    typeof item[columnName] === 'object' ? h('td', item[columnName].length) :  h('td', item[columnName])
  ]))),
]);
