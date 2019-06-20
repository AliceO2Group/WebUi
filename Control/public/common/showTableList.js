import {h} from '/js/src/index.js';
import parseObject from './utils.js';

/**
 * Generic table to show list of objects
 * This can be forked to show more specific data (format date, colors, more buttons...)
 * @param {Array.<Object.<string, Any>>} list - things to be shown
 * @param {Array.<function(DOMEvent, item)>} actions - (optional) add a button for each line with object as argument
 * @return {vnode} table view
 */
export default (list, actions) => h('table.table', [
  h('thead', [
    h('tr',
      [
        list.length > 0 && Object.keys(list[0]).map((columnName) => h('th', {style: 'text-align:center'}, columnName)),
        actions && h('th.text-center', {style: 'text-align:center'}, 'Actions')
      ]
    )
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
    actions && h('td.btn-group',
      h('button.btn.btn-primary', {onclick: (event) => actions[0](event, item)}, 'Details'),
      h('button.btn.btn-danger', {onclick: (event) => actions[1](event, item)}, 'Shut Down'),
    )
  ]))),
]);
