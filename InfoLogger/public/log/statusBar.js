import {h, icon} from '/js/src/index.js';

export default (model) => [
  h('.flex-row', [
    h('.w-50', statusLogs(model)),
    h('.w-50.text-right', applicationMessage(model), applicationOptions(model)),
  ]),
];

/**
 * Show information about the logs seen by user:
 * - source (query or live)
 * - how many are loaded, how many in database
 * - timing, hostname, stats, etc.
 * @param {object} model
 * @return {vnode}
 */
const statusLogs = (model) => model.servicesResult.match({
  NotAsked: () => 'Loading services...',
  Loading: () => 'Loading services...',
  Success: (services) => [
    statusStats(model),
    model.log.queryResult.match({
      NotAsked: () => null,
      Loading: () => 'Querying server...',
      Success: (result) => statusQuery(model, result),
      Failure: (error) => h('.danger', error),
    }),
    model.log.liveEnabled && statusLive(model, services),
  ],
  Failure: () => h('span.danger', 'Unable to load services'),
});

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
  `(loaded out of ${result.total}${result.more ? '+' : ''} in ${(result.time / 1000).toFixed(2)} second${(result.time / 1000) >= 2 ? 's' : ''})`,
];

const statusLive = (model, services) => [
  `(streaming from ${services.streamHostname} for ${model.timezone.formatDuration(model.log.liveStartedAt)})`
];

const statusStats = (model) => [
  h('span.ph2', `${model.log.list.length} message${model.log.list.length >= 2 ? 's' : ''}`),
  h('span.ph2.severity-i', `${model.log.stats.info} info`),
  h('span.ph2.severity-w', `${model.log.stats.warning} warn`),
  h('span.ph2.severity-e', `${model.log.stats.error} error`),
  h('span.ph2.severity-f', `${model.log.stats.fatal} fatal`),
];
