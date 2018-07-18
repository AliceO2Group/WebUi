import {h, icon} from '/js/src/index.js';

export default (model) => [
  h('.flex-row', [
    h('.w-50', statusLogs(model)),
    h('.w-50.text-right', iconSidebar()),
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

const iconSidebar = (svg) => h('svg.icon', {fill: 'currentcolor', viewBox: '0 0 480 480', onclick: () => model.toggleInspector()},
  h('path', {d: 'M0,32v416h480V32H0z M288,416H32V64h256V416z M448,416H320V64h128V416z'}));

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
