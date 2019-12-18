import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
/**
 * @file Page to show configuration components (content and header)
 */

/**
 * Header of configuration page
 * Only page title with no action
 * @param {Object} model
 * @return {vnode}
 */
export const header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Configuration')
  ]),
  h('.flex-grow text-right', [

  ])
];

/**
 * Content of configuration page
 * @param {Object} model
 * @return {vnode}
 */
export const content = (model) => h('.scroll-y.absolute-fill', [
  model.configuration.cruList.match({
    NotAsked: () => 'nu intreba',
    Loading: () => pageLoading(),
    Success: (data) => null,
    Failure: (error) => pageError(error),
  })
]);
