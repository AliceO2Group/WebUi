import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableList from '../common/showTableList.js';

/**
 * @file Page to show roles (content and header)
 */

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Roles')
  ]),
  h('.flex-grow text-right', [

  ])
];

/**
 * Content of the page representing roles
 * Depends of the loading of `model.role.list`
 * @param {object} model
 * @return {vnode}
 */
export let content = (model) => h('.scroll-y.absolute-fill', [
  model.role.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data),
    Failure: (error) => pageError(error),
  })
]);

const showContent = (model, list) => list.length
  ? showTableList(list)
  : h('h3.m4', ['No role found.']);
