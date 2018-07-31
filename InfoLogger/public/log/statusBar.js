import {h, icon} from '/js/src/index.js';

export default (model) => [
  h('.flex-row', [
    h('.w-50', statusLogs(model)),
    h('.w-50.text-right', applicationMessage(model), applicationOptions(model)),
  ]),
];

const statusLogs = (model) => [
  model.log.queryResult.match({
    NotAsked: () => null,
    Loading: () => 'Loading...',
    Success: (result) => [statusQuery(model, result), statusStats(model)],
    Failure: (error) => h('.danger', error),
  }),
  model.log.liveEnabled && [statusLive(model), statusStats(model)],
];

const applicationMessage = (model) => model.log.list.length > model.log.applicationLimit
 ? h('span.danger', `Application reached more than ${model.log.applicationLimit} logs, please clear if possible `)
 : null;

const applicationOptions = (model) => [
  h('label.d-inline', {title: 'Scroll down in live mode on new log incoming'}, h('input', {
    type: 'checkbox',
    checked: model.log.autoScrollLive,
    onchange: () => model.log.toggleAutoScroll()
  }), ' Autoscroll'),
  h('span.mh1'),
  h('label.d-inline', {title: 'Show details of selecte log'}, h('input', {
    type: 'checkbox',
    checked: model.inspectorEnabled,
    onchange: () => model.toggleInspector()
  }), ' Inspector'),
];

const statusQuery = (model, result) => [
  `${result.count} messages out of ${result.total}${result.more ? '+' : ''} (${(result.time / 1000).toFixed(2)} seconds) `,
];

const statusLive = (model) => [
  `${model.log.list.length} message${model.log.list.length > 1 ? 's' : ''} (live)`
];

const statusStats = (model) => [
  h('span.ph2.severity-i', `${model.log.stats.info} info`),
  h('span.ph2.severity-w', `${model.log.stats.warning} warn`),
  h('span.ph2.severity-e', `${model.log.stats.error} error`),
  h('span.ph2.severity-f', `${model.log.stats.fatal} fatal`),
];
