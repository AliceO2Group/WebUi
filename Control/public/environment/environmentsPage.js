import {h, iconPlus} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import errorPage from '../common/errorPage.js';
import parseObject from './../common/utils.js';

/**
 * @file Page to show a list of environments (content and header)
 */

/**
 * Header of page showing list of environments
 * With one button to create a new environment and page title
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environments')
  ]),
  h('.flex-grow text-right', [
    h('button.btn', {onclick: () => model.router.go('?page=newEnvironment')}, iconPlus())
  ])
];

/**
 * Scrollable list of environments or page loading/error otherwise
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center', [
  model.environment.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data.environments),
    Failure: (error) => errorPage(error),
  })
]);

/**
 * Show a list of environments with a button to edit each of them
 * Print a message if the list is empty.
 * @param {Object} model
 * @param {Array.<Environment>} list
 * @return {vnode}
 */
const showContent = (model, list) => (list && Object.keys(list).length > 0)
  ? h('.scroll-auto', environmentsTable(model, list))
  : h('h3.m4', ['No environments found.']);


/**
 * Create the table of environments
 * @param {Object} model
 * @param {Array<String>} list
 * @return {vnode}
 */
const environmentsTable = (model, list) => {
  const tableHeaders = ['Tasks', 'Run', 'Created', 'Role', 'State', 'Actions'];
  return h('table.table', [
    h('thead', [
      h('tr', [tableHeaders.map((header) => h('th', {style: 'text-align: center;'}, header))])
    ]),
    h('tbody', [
      list.map((item) => h('tr', [
        h('td', {style: 'text-align: center;'}, parseObject(item.tasks, 'tasks')),
        h('td', {style: 'text-align: center;'}, item.currentRunNumber ? item.currentRunNumber : '-'),
        h('td', {style: 'text-align: center;'}, parseObject(item.createdWhen, 'createdWhen')),
        h('td', {style: 'text-align: center;'}, item.rootRole),
        h('td', {
          class: (item.state === 'RUNNING' ?
            'success'
            : (item.state === 'CONFIGURED' ? 'warning' : '')),
          style: 'font-weight: bold; text-align: center;'
        }, item.state
        ),
        h('td', {style: 'text-align: center;'},
          h('.btn-group',
            actionButton('Details', 'Open the environment page with more details', 'primary', model.loader,
              () => model.router.go(`?page=environment&id=${item.id}`)
            ),
            actionButton('Shutdown', 'Shutdown environment', 'danger', model.loader,
              () => confirm(`Are you sure you want to delete this ${item.state} environment? ` + item.id)
                && model.environment.destroyEnvironment({id: item.id, allowInRunningState: true})
            ),
          )
        )
      ]),
      ),
    ]),
  ]);
};

/**
 * Button for environments table
 * @param {String} label
 * @param {String} title
 * @param {String} type
 * @param {Object} loader
 * @param {function} action
 * @return {vnode}
 */
const actionButton = (label, title, type, loader, action) =>
  h(`button.btn.btn-${type}`, {
    class: loader.active ? 'loading' : '',
    disabled: loader.active,
    title: title,
    onclick: () => action(),
  }, label);
