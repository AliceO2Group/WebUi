import {h} from '/js/src/index.js';

import {severityClass, severityLabel} from './severityUtils.js';

export default (model) => model.log.item ? h('', [
  h('table.table.f7.table-sm', h('tbody', [
    h('tr', h('td.cell-m', {className: severityClass(model.log.item.severity)}, 'Severity'),
            h('td', {className: severityClass(model.log.item.severity)},
            severityLabel(model.log.item.severity))),
    h('tr', h('td', 'Date'), h('td', (model.timezone.format(model.log.item.timestamp, 'date')))),
    h('tr', h('td', 'Time'), h('td', (model.timezone.format(model.log.item.timestamp, 'time')))),
    h('tr', h('td', 'Hostname'), h('td', model.log.item.hostname)),
    h('tr', h('td', 'Rolename'), h('td', model.log.item.rolename)),
    h('tr', h('td', 'PID'), h('td', model.log.item.pid)),
    h('tr', h('td', 'Username'), h('td', model.log.item.username)),
    h('tr', h('td', 'System'), h('td', model.log.item.system)),
    h('tr', h('td', 'Facility'), h('td', model.log.item.facility)),
    h('tr', h('td', 'Detector'), h('td', model.log.item.detector)),
    h('tr', h('td', 'Partition'), h('td', model.log.item.partition)),
    h('tr', h('td', 'Run'), h('td', model.log.item.run)),
    h('tr', h('td', 'ErrCode'), h('td', model.log.item.errcode)),
    h('tr', h('td', 'ErrLine'), h('td', model.log.item.errline)),
    h('tr', h('td', 'ErrSource'), h('td', model.log.item.errsource)),
  ])),
  h('.p2.f7', h('', model.log.item.message))
]) : null;
