import {h} from '/js/src/index.js';

/**
 * Shows a page to view framework information
 * @param {Object} model
 * @return {vnode}
 */
export default (model) => h('.p2.absolute-fill.text-center',
  model.frameworkInfo.item.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (data) => showContent(data),
    Failure: (error) => showContent({error: {message: error}}),
  })
);

/**
 * Display a table with framework information
 * @param {Object} item
 * @return {vnode}
 */
const showContent = (item) => h('table.table.shadow-level2', {style: 'white-space: pre-wrap;'}, [
  h('tbody', Object.keys(item).map((columnName, index) => [
    Object.keys(item[columnName]).map((name) =>
      h('tr', [
        h('th.w-25', columnName + '.' + name),
        h('td', JSON.stringify(item[columnName][name])),
      ])
    ),
    (index + 1) < Object.keys(item).length && h('tr', [h('th'), h('td')])
  ]))
]);
