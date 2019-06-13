import {h} from '/js/src/index.js';
import parseObject from './utils.js';

/**
 * Generic table to show list of objects
 * This can be forked to show more specific data (format date, colors, more buttons...)
 * @param {Array.<Object.<string, Any>>} list - things to be shown
 * @param {function(DOMEvent, item)} onclick - (optional) add a button for each line with object as argument
 * @return {vnode} table view
 */
export default (list, onclick) => h('table.table', [
  h('thead', [
    h('tr', [
      list.length > 0 && Object.keys(list[0]).map((columnName) => h('th', columnName)),
      onclick && h('th', '')
    ])
  ]),
  h('tbody', list.map((item) => h('tr', [
    Object.keys(item).map(
      (columnName) => typeof item[columnName] === 'object'
        ? h('td', parseObject(item[columnName], columnName))
        : h('td',
          columnName === 'state' && {
            class: (item[columnName] === 'RUNNING' ? 'success' : (item[columnName] === 'CONFIGURED' ? 'warning' : '')),
            style: 'font-weight: bold;'
          },
          item[columnName]

        )
    ),
    onclick && h('td', h('button.btn', {onclick: (event) => onclick(event, item)}, 'Details'))
  ]))),
]);
