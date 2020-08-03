
import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';

/**
 * @file Page to FrameworkInfo(About) (content and header)
 */

/**
 * Header of the about page
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'About')),
  h('.flex-grow text-right', [])
];

/**
 * Content of the status page (or frameworkinfo)
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.flex-column', [
  createTableForControlGUIInfo(model.frameworkInfo),
  createTableForAliECSInfo(model.frameworkInfo),
]);

/**
 * Show COG and its dependencies info based on request status
 * @param {Object} frameworkInfo
 * @return {vnode}
 */
const createTableForControlGUIInfo = (frameworkInfo) =>
  h('.p2', [
    frameworkInfo.control.match({
      NotAsked: () => null,
      Loading: () => pageLoading(),
      Success: (data) => showContent(data),
      Failure: (error) => errorPage(error),
    }),
  ]);

/**
 * Show AliECS Core info in a table
 * @param {Object} frameworkInfo
 * @return {vnode}
 */
const createTableForAliECSInfo = (frameworkInfo) =>
  h('.p2', [
    frameworkInfo.aliEcs.match({
      NotAsked: () => null,
      Loading: () => pageLoading(),
      Success: (data) => showContent({'AliECS Core Info': data}),
      Failure: (error) => errorPage(error),
    })
  ]);


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
            h('th.flex-row', [
              item[columnName].status && item[columnName].status.ok &&
              h('.badge.bg-success.white', '✓'),
              item[columnName].status && !item[columnName].status.ok &&
              h('.badge.bg-danger.white', '✕'),
              h('.mh2', {style: 'text-decoration: underline'}, columnName.toUpperCase()),
            ])
          ),
          Object.keys(item[columnName]).map((name) =>
            name === 'status' ?
              !item[columnName]['status'].ok &&
              h('tr.danger', [
                h('th.w-25', 'error'),
                h('td', item[columnName]['status'].message),
              ])
              :
              h('tr', [
                h('th.w-25', name),
                h('td', JSON.stringify(item[columnName][name])),
              ])
          )])
      ])
    ])
  ]);
