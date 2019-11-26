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
* Display a table with cog and its dependencies information
* @param {Object} item
* @return {vnode}
*/
const showContent = (item) =>
  Object.keys(item).map((columnName) => [
    h('.shadow-level1', [
      h('table.table', {
        style: 'white-space: pre-wrap;'
      }, [
        h('tbody', [
          h('tr',
            h('th.w-25', {style: 'text-decoration: underline'}, columnName.toUpperCase())),
          Object.keys(item[columnName]).map((name) =>
            h('tr', [
              h('th.w-25', name),
              h('td', JSON.stringify(item[columnName][name])),
            ])
          )])
      ])
    ])
  ]);
