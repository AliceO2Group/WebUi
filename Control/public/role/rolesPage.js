import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import switchCase from '../common/switchCase.js';
import showTableList from '../common/showTableList.js';

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Roles')
  ]),
  h('.flex-grow text-right', [

  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  switchCase(model.role.list.getState(), {
    'NOT_ASKED': () => null,
    'LOADING': () => pageLoading(),
    'SUCCESS': () => showContent(model, model.role.list.getPayload().roles),
    'FAILURE': () => pageError(model.role.list.getPayload()),
  })(model)
]);

const showContent = (model, list) => list.length
  ? showTableList(list)
  : h('h3.m4', ['No role found.']
);
