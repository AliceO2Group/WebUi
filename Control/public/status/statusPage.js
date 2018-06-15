import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import switchCase from '../common/switchCase.js';
import showTableItem from '../common/showTableItem.js';

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Status')
  ]),
  h('.flex-grow text-right', [

  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  switchCase(model.status.item.getState(), {
    'NOT_ASKED': () => null,
    'LOADING': () => pageLoading(),
    'SUCCESS': () => showContent(model, model.status.item.getPayload()),
    'FAILURE': () => pageError(model.status.item.getPayload()),
  })(model)
]);

const showContent = (model, item) => [
  showTableItem(item)
];
