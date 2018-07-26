import {h} from '/js/src/index.js';

export default (model) => [
  queryButton(model),
  ' ',
  liveButton(model),
  ' ',
  h('button.btn', {onclick: () => model.log.empty()}, 'Clear'),
  h('span.mh3'),
  h('button.btn', {disabled: !model.log.stats.error, onclick: () => model.log.firstError(), title: 'Go to first error/fatal (ALT + left arrow)'}, '❮❮'),
  ' ',
  h('button.btn', {disabled: !model.log.stats.error, onclick: () => model.log.previousError(), title: 'Go to previous error/fatal (left arrow)'}, '❮'),
  ' ',
  h('button.btn', {disabled: !model.log.stats.error, onclick: () => model.log.nextError(), title: 'Go to next error/fatal (left arrow)'}, '❯'),
  ' ',
  h('button.btn', {disabled: !model.log.stats.error, onclick: () => model.log.lastError(), title: 'Go to last error/fatal (ALT + right arrow)'}, '❯❯'),
  ' ',
];

/**
 * Query button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 */
const queryButton = (model) => h('button.btn.btn-primary', model.servicesResult.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (services) => ({
    title: services.query ? 'Query database with filters (Enter)' : 'Query service not configured',
    disabled: !services.query || model.log.queryResult.isLoading(),
    className: model.log.queryResult.isLoading() ? 'loading' : '',
    onclick: () => model.log.query()
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Query');

/**
 * Live button final state depends on the following states
 * - services lookup
 * - services result
 * - query lookup
 * - websocket status
 */
const liveButton = (model) => h('button.btn', model.servicesResult.match({
  NotAsked: () => ({disabled: true}),
  Loading: () => ({disabled: true, className: 'loading'}),
  Success: (services) => ({
    title: services.live ? 'Stream logs with filtering' : 'Live service not configured',
    disabled: !services.live || model.log.queryResult.isLoading(),
    className: !model.ws.authed ? 'loading' : (model.log.liveEnabled ? 'active' : ''),
    onclick: () => model.log.liveEnabled ? model.log.liveStop() : model.log.liveStart()
  }),
  Failure: () => ({disabled: true, className: 'danger'}),
}), 'Live');
