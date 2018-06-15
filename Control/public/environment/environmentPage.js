import {h} from '/js/src/index.js';
import pageLoading from '../common/pageLoading.js';
import pageError from '../common/pageError.js';
import switchCase from '../common/switchCase.js';
import showTableItem from '../common/showTableItem.js';

export let header = (model) => [
  h('.w-50 text-center', [
    h('h4', 'Environment')
  ]),
  h('.flex-grow text-right', [

  ])
];

export let content = (model) => h('.scroll-y.absolute-fill', [
  switchCase(model.environment.item.getState(), {
    'NOT_ASKED': () => null,
    'LOADING': () => pageLoading(),
    'SUCCESS': () => showContent(model, model.environment.item.getPayload().environment),
    'FAILURE': () => pageError(model.environment.item.getPayload()),
  })(model)
]);

const showContent = (model, item) => [
  showTableItem(item),
  showControl(model, item)
];

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
  switchCase(model.environment.itemControl.getState(), {
    'NOT_ASKED': () => null,
    'LOADING': () => null,
    'SUCCESS': () => h('.primary', 'done'),
    'FAILURE': () => h('p.danger', model.environment.itemControl.getPayload()),
  })()
]);
