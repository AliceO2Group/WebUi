import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import switchCase from '../common/switchCase.js';
import showTableList from '../common/showTableList.js';
import {iconPlus} from '/js/src/icons.js';

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environments')
  ]),
  h('.flex-grow text-right', [
    h('button.btn', {onclick: () => model.router.go('?page=newEnvironment')}, iconPlus())
  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  switchCase(model.environment.list.getState(), {
    'NOT_ASKED': () => null,
    'LOADING': () => pageLoading(),
    'SUCCESS': () => showContent(model, model.environment.list.getPayload().environments),
    'FAILURE': () => pageError(model.environment.list.getPayload()),
  })(model)
]);

const showContent = (model, list) => list.length
  ? showTableList(list, (event, item) => model.router.go(`?page=environment&id=${item.id}`))
  : h('h3.m4', ['No environment found.']
);
