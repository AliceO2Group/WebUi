import {h} from '/js/src/index.js';
import parseObject from './utils.js';

/**
 * Generic table to show list of objects
 * This can be forked to show more specific data (format date, colors, more buttons...)
 * @param {Object} model
 * @param {Array.<Object.<string, Any>>} list - things to be shown
 * @param {Array.<function(DOMEvent, item)>} actions - (optional) add a button for each line with object as argument
 * @return {vnode} table view
 */
export default (model, list, actions) => {
  list.forEach((environment) => delete environment.userVars);
  return h('table.table', [
    h('thead', [
      h('tr', [
        list.length > 0 && Object.keys(list[0]).map((columnName) => h('th', {style: 'text-align:center'}, columnName)),
        actions && h('th', {style: 'text-align:center'}, 'Actions')
      ])
    ]),
    h('tbody', list.map((item) => h('tr', [
      Object.keys(item).map(
        (columnName) => typeof item[columnName] === 'object'
          ? h('td', {style: 'text-align: center'}, parseObject(item[columnName], columnName))
          : h('td',
            columnName === 'state' ? {
              class: (item[columnName] === 'RUNNING' ?
                'success'
                : (item[columnName] === 'CONFIGURED' ? 'warning' : '')),
              style: 'font-weight: bold;text-align:center'
            } : {style: 'text-align:center'},
            item[columnName]
          )
      ),
      actions && h('td', {style: 'text-align:center'},
        h('.btn-group',
          h('button.btn.btn-primary', {
            class: model.loader.active ? 'loading' : '',
            disabled: model.loader.active,
            onclick: (event) => actions[0](event, item),
            title: 'Open the environment page with more details'
          }, 'Details'),
          actions.length >= 2 && h('button.btn.btn-danger', {
            class: model.loader.active ? 'loading' : '',
            disabled: model.loader.active,
            onclick: (event) => actions[1](event, item),
            title: 'Shutdown environment'
          }, 'Shutdown'),
        )
      )
    ]))),
  ]);
};
