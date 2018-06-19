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
  model.role.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data),
    Failure: (error) => pageError(error),
  })
]);

const showContent = (model, list) => list.length
  ? showTableList(list)
  : h('h3.m4', ['No role found.']
);
