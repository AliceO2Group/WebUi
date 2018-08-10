import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';

/**
 * @file Page to FrameworkInfo (content and header)
 */

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Status')
  ]),
  h('.flex-grow text-right', [

  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  model.status.item.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data),
    Failure: (error) => pageError(error),
  })
]);

const showContent = (model, item) => [
  showTableItem(item)
];
