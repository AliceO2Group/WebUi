import {h, switchCase} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import showTableItem from '../common/showTableItem.js';

/**
 * @file Page to show 1 environment (content and header)
 */

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environment')
  ]),
  h('.flex-grow text-right', [

  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  model.environment.item.match({
    NotAsked: () => null,
    Loading: () => pageLoading(),
    Success: (data) => showContent(model, data.environment),
    Failure: (error) => pageError(error),
  })
]);

const showContent = (model, item) => [
  showTableItem(item),
  showControl(model, item)
];

// List of buttons, each one is an action to do on the current environment `item`
const showControl = (model, item) =>   h('.m4', [
  h('h4', 'Control'),
  h('', [
    h('button.btn', {
      class: model.environment.itemControl.isLoading() ? 'loading' : '',
      disabled: model.environment.itemControl.isLoading(),
      onclick: () => model.environment.controlEnvironment({id: item.id, type: 'START_ENVIRONMENT'})},
      'START'
      ), ' ',
    h('button.btn', {
      class: model.environment.itemControl.isLoading() ? 'loading' : '',
      disabled: model.environment.itemControl.isLoading(),
      onclick: () => model.environment.controlEnvironment({id: item.id, type: 'STOP_ENVIRONMENT'})},
      'STOP'
      ), ' ',
    h('button.btn', {
      class: model.environment.itemControl.isLoading() ? 'loading' : '',
      disabled: model.environment.itemControl.isLoading(),
      onclick: () => model.environment.controlEnvironment({id: item.id, type: 'CONFIGURE'})},
      'CONFIGURE'
      ), ' ',
    h('button.btn.btn-danger', {
      class: model.environment.itemControl.isLoading() ? 'loading' : '',
      disabled: model.environment.itemControl.isLoading(),
      onclick: () => model.environment.destroyEnvironment({id: item.id})},
      'DELETE'
      ), ' ',
  ]),
  model.environment.itemControl.match({
    NotAsked: () => null,
    Loading: () => null,
    Success: (data) => h('.primary', 'done'),
    Failure: (error) => h('p.danger', error),
  })
]);
