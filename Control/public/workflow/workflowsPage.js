import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';
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
    h('h4', 'Workflows')
  ]),
  h('.flex-grow text-right', [
  ])
];

/**
 * Scrollable list of environments or page loading/error otherwise
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.workflow.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data.workflowTemplates.sort()),
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
const showContent = (model, list) => list.length
  ? showTableItem(list)
  : h('h3.m4', ['No workflows found.']);
