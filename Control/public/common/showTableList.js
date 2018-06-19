import {h} from '/js/src/index.js';

export default(list, onclick) => h('table.table', [
  h('thead', [
    h('tr', [
      Object.keys(list[0]).map((columnName) => h('th', columnName)),
      onclick && h('th', '')
    ])
  ]),
  h('tbody', list.map((item) => h('tr', [
    Object.keys(list[0]).map((columnName) => h('td', item[columnName])),
    onclick && h('td', h('button.btn', {onclick: (event) => onclick(event, item)}, 'Details'))
  ]))),
]);
