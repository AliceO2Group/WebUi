import {h} from '/js/src/index.js';

export default (model) => [
  model.log.queryResult.match({
    NotAsked: () => null,
    Loading: () => 'Loading...',
    Success: (result) => [statusQuery(model, result), statusStats(model)],
    Failure: (error) => h('.danger', error),
  }),
  model.log.liveEnabled && [statusLive(model), statusStats(model)]
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
