/* eslint max-len: 0 */

import {h, iconChevronBottom} from '/js/src/index.js';

import datePicker from '../common/datePicker.js';
import {TIME_S, TIME_MS} from '../common/Timezone.js';

export default (model) => h('table.table-filters', [
  h('tbody', [
    h('tr', [
      h('td', [
        h('button.btn.w-50', {className: model.log.columns.date ? 'active' : '', onclick: () => model.log.toggleColumn('date')}, 'Date'),
        h('.btn-group.w-50', [
          h('button.btn.w-75', {className: model.log.columns.time ? 'active' : '', onclick: () => model.log.toggleColumn('time')}, 'Time'),
          h('button.btn.dropdown.w-25', {
            className: model.log.isTimeDropdownEnabled ? 'dropdown-open active' : '',
            style: 'padding:0.1em',
            onclick: () => model.log.toggleTimeFormat()
          }, iconChevronBottom(),
          h('.dropdown-menu', [
            h('a.menu-item.text-ellipsis', {
              className: model.log.timeFormat === TIME_S ? 'selected' : '',
              onclick: () => {
                model.log.timeFormat = TIME_S;
                model.log.setColumnVisibility('time', true);
              }
            }, `HH:mm:ss`),
            h('a.menu-item.text-ellipsis', {
              className: model.log.timeFormat === TIME_MS ? 'selected' : '',
              onclick: () => {
                model.log.timeFormat = TIME_MS;
                model.log.setColumnVisibility('time', true);
              }
            }, `HH:mm:ss.SSS`),
          ])
          )
        ])
      ]),
      h('td', h('button.btn.w-100', {className: model.log.columns.hostname ? 'active' : '', onclick: () => model.log.toggleColumn('hostname')}, 'Hostname')),
      h('td', h('button.btn.w-100', {className: model.log.columns.rolename ? 'active' : '', onclick: () => model.log.toggleColumn('rolename')}, 'Rolename')),
      h('td', h('button.btn.w-100', {className: model.log.columns.pid ? 'active' : '', onclick: () => model.log.toggleColumn('pid')}, 'PID')),
      h('td', h('button.btn.w-100', {className: model.log.columns.username ? 'active' : '', onclick: () => model.log.toggleColumn('username')}, 'Username')),
      h('td', h('button.btn.w-100', {className: model.log.columns.system ? 'active' : '', onclick: () => model.log.toggleColumn('system')}, 'System')),
      h('td', h('button.btn.w-100', {className: model.log.columns.facility ? 'active' : '', onclick: () => model.log.toggleColumn('facility')}, 'Facility')),
      h('td', h('button.btn.w-100', {className: model.log.columns.detector ? 'active' : '', onclick: () => model.log.toggleColumn('detector')}, 'Detector')),
      h('td', h('button.btn.w-100', {className: model.log.columns.partition ? 'active' : '', onclick: () => model.log.toggleColumn('partition')}, 'Partition')),
      h('td', h('button.btn.w-100', {className: model.log.columns.run ? 'active' : '', onclick: () => model.log.toggleColumn('run')}, 'Run')),
      h('td', h('button.btn.w-100', {className: model.log.columns.errcode ? 'active' : '', onclick: () => model.log.toggleColumn('errcode')}, 'ErrCode')),
      h('td', h('button.btn.w-100', {className: model.log.columns.errline ? 'active' : '', onclick: () => model.log.toggleColumn('errline')}, 'ErrLine')),
      h('td', h('button.btn.w-100', {className: model.log.columns.errsource ? 'active' : '', onclick: () => model.log.toggleColumn('errsource')}, 'ErrSource')),
      h('td', h('button.btn.w-100', {className: model.log.columns.message ? 'active' : '', onclick: () => model.log.toggleColumn('message')}, 'Message'))
    ]),
    h('tr', {className: model.log.liveEnabled? 'd-none':''}, [
      h('td.relative',
        model.log.focus.timestampSince && datePicker(model, model.log.filter.criterias.timestamp.$since),
        h('input.form-control', {type: 'text', onfocus: () => model.log.setFocus('timestampSince', true), onblur: () => model.log.setFocus('timestampSince', false), oninput: (e) => model.log.filter.setCriteria('timestamp', 'since', e.target.value), placeholder: 'from', value: model.log.filter.criterias.timestamp.since})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('hostname', 'match', e.target.value), value: model.log.filter.criterias.hostname.match, placeholder: 'match'})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('rolename', 'match', e.target.value), value: model.log.filter.criterias.rolename.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('pid', 'match', e.target.value), value: model.log.filter.criterias.pid.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('username', 'match', e.target.value), value: model.log.filter.criterias.username.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('system', 'match', e.target.value), value: model.log.filter.criterias.system.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('facility', 'match', e.target.value), value: model.log.filter.criterias.facility.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('detector', 'match', e.target.value), value: model.log.filter.criterias.detector.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('partition', 'match', e.target.value), value: model.log.filter.criterias.partition.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('run', 'match', e.target.value), value: model.log.filter.criterias.run.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errcode', 'match', e.target.value), value: model.log.filter.criterias.errcode.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errline', 'match', e.target.value), value: model.log.filter.criterias.errline.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errsource', 'match', e.target.value), value: model.log.filter.criterias.errsource.match})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('message', 'match', e.target.value), value: model.log.filter.criterias.message.match}))
    ]),
    h('tr', {className: model.log.liveEnabled? 'd-none':''}, [
      h('td.relative',
        model.log.focus.timestampUntil && datePicker(model, model.log.filter.criterias.timestamp.$until),
        h('input.form-control', {type: 'text', onfocus: () => model.log.setFocus('timestampUntil', true), onblur: () => model.log.setFocus('timestampUntil', false), oninput: (e) => model.log.filter.setCriteria('timestamp', 'until', e.target.value), placeholder: 'to', value: model.log.filter.criterias.timestamp.until})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('hostname', 'exclude', e.target.value), value: model.log.filter.criterias.hostname.exclude, placeholder: 'exclude'})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('rolename', 'exclude', e.target.value), value: model.log.filter.criterias.rolename.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('pid', 'exclude', e.target.value), value: model.log.filter.criterias.pid.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('username', 'exclude', e.target.value), value: model.log.filter.criterias.username.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('system', 'exclude', e.target.value), value: model.log.filter.criterias.system.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('facility', 'exclude', e.target.value), value: model.log.filter.criterias.facility.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('detector', 'exclude', e.target.value), value: model.log.filter.criterias.detector.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('partition', 'exclude', e.target.value), value: model.log.filter.criterias.partition.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('run', 'exclude', e.target.value), value: model.log.filter.criterias.run.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errcode', 'exclude', e.target.value), value: model.log.filter.criterias.errcode.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errline', 'exclude', e.target.value), value: model.log.filter.criterias.errline.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('errsource', 'exclude', e.target.value), value: model.log.filter.criterias.errsource.exclude})),
      h('td', h('input.form-control', {type: 'text', oninput: (e) => model.log.filter.setCriteria('message', 'exclude', e.target.value), value: model.log.filter.criterias.message.exclude}))
    ])
  ])
]);
