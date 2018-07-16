import {h, iconPlus, switchCase} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableList from '../common/showTableList.js';

/**
 * @file Page to show a list of environments (content and header)
 */

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environments')
  ]),
  h('.flex-grow text-right', [
    h('button.btn', {onclick: () => model.router.go('?page=newEnvironment')}, iconPlus())
  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  model.environment.list.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data.environments),
    Failure: (error) => pageError(error),
  })
]);

const showContent = (model, list) => list.length
  ? showTableList(list, (event, item) => model.router.go(`?page=environment&id=${item.id}`))
  : h('h3.m4', ['No environment found.']
);
