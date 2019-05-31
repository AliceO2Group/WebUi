import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';

/**
 * @file Page to FrameworkInfo (content and header)
 */

/**
 * Header of the status page (or frameworkinfo)
 * Empty for now, no action needed, only page title
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', h('h4', 'Status')),
  h('.flex-grow text-right', [])
];

/**
 * Content of the status page (or frameworkinfo)
 * Show loading or error on other cases
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill.text-center', [
  model.status.item.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: () => pageError("test"),
    // Success: (data) => showContent(model, data),
    Failure: (error) => pageError(error),
  })
]);

/**
 * Show status infos with a simple table, one line per property
 * @param {Object} model
 * @param {FrameworkInfo} item - status got from server
 * @return {vnode}
 */
const showContent = (model, item) => [
  showTableItem(item)
];

