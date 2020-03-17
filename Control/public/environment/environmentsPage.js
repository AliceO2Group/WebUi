import {h, iconPlus} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableList from '../common/showTableList.js';

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
    Failure: (error) => pageError(error),
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
  ? h('.scroll-auto', showTableList(model, list, [
    (event, item) => model.router.go(`?page=environment&id=${item.id}`),
    (event, item) =>
      confirm(`Are you sure you want to delete this ${item.state} environment? ` + item.id)
      && model.environment.destroyEnvironment({id: item.id, allowInRunningState: true})
  ]))
  : h('h3.m4', ['No environments found.']);
