import {h} from '/js/src/index.js';

export default (model) => [
  h('.btn-group', [
    h('button.btn', {
      className: !model.log.filter.criterias.severity.match ? 'active' : '',
      onclick: () => model.log.filter.setCriteria('severity', 'match', ''),
      title: 'Match severity info, warnings, errors and fatals (= all logs)'
    }, 'Info'),
    h('button.btn', {
      className: model.log.filter.criterias.severity.match === 'W E F' ? 'active' : '',
      onclick: () => model.log.filter.setCriteria('severity', 'match', 'W E F'),
      title: 'Match severity warnings, errors and fatals'
    }, 'Warn'),
    h('button.btn', {
      className: model.log.filter.criterias.severity.match === 'E F' ? 'active' : '',
      onclick: () => model.log.filter.setCriteria('severity', 'match', 'E F'),
      title: 'Match severity errors and fatals'
    }, 'Error'),
    h('button.btn', {
      className: model.log.filter.criterias.severity.match === 'F' ? 'active' : '',
      onclick: () => model.log.filter.setCriteria('severity', 'match', 'F'),
      title: 'Match severity only fatals'
    }, 'Fatal'),
  ]),
  h('span.mh3'),
  h('.btn-group', [
    h('button.btn', {className: model.log.filter.criterias.level.max === 1 ? 'active' : '', onclick: () => model.log.filter.setCriteria('level', 'max', 1), title: 'Filter level ≤ 1'}, 'Shift'),
    h('button.btn', {className: model.log.filter.criterias.level.max === 6 ? 'active' : '', onclick: () => model.log.filter.setCriteria('level', 'max', 6), title: 'Filter level ≤ 6'}, 'Oncall'),
    h('button.btn', {className: model.log.filter.criterias.level.max === 11 ? 'active' : '', onclick: () => model.log.filter.setCriteria('level', 'max', 11), title: 'Filter level ≤ 11'}, 'Devel'),
    h('button.btn', {className: model.log.filter.criterias.level.max === 21 ? 'active' : '', onclick: () => model.log.filter.setCriteria('level', 'max', 21), title: 'Filter level ≤ 21'}, 'Debug'),
  ]),
  h('span.mh3'),
  h('.btn-group', [
    h('button.btn', {className: model.log.limit === 1000 ? 'active' : '', onclick: () => model.log.setLimit(1000), title: 'Keep only 1k logs in the view'}, '1k'),
    h('button.btn', {className: model.log.limit === 10000 ? 'active' : '', onclick: () => model.log.setLimit(10000), title: 'Keep only 10k logs in the view'}, '10k'),
    h('button.btn', {className: model.log.limit === 100000 ? 'active' : '', onclick: () => model.log.setLimit(100000), title: 'Keep only 100k logs in the view'}, '100K'),
  ]),
  h('span.mh3'),
  h('.btn-group', [
    h('button.btn', {className: !model.timezone.local ? 'active' : '', onclick: () => model.timezone.setGeneva(), title: 'Set display timezone to Geneva'}, 'Geneva'),
    h('button.btn', {className: model.timezone.local ? 'active' : '', onclick: () => model.timezone.setLocal(), title: 'Set display timezone to Local'}, 'Local'),
  ]),
];

