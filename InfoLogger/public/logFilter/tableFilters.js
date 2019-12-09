/* eslint max-len: 0 */

import {h, iconChevronBottom} from '/js/src/index.js';

import datePicker from '../common/datePicker.js';
import {TIME_S, TIME_MS} from '../common/Timezone.js';

const filterLabels = ['Hostname', 'Rolename', 'PID', 'Username', 'System', 'Facility', 'Detector', 'Partition', 'Run', 'ErrCode', 'ErrLine', 'ErrSource', 'Message'];

export default (model) => h('table.table-filters', [
  h('tbody', [
    h('tr', [
      h('td', [
        h('button.btn.w-50', {className: model.table.colsHeader.date.visible ? 'active' : '', onclick: () => model.table.toggleColumn('date')}, 'Date'),
        h('.btn-group.w-50', [
          h('button.btn.w-75', {className: model.table.colsHeader.time.visible ? 'active' : '', onclick: () => model.table.toggleColumn('time')}, 'Time'),
          h('button.btn.dropdown.w-25',
            {
              className: model.log.isTimeDropdownEnabled ? 'dropdown-open active' : '',
              style: 'padding:0.1em',
              onclick: () => model.log.toggleTimeFormat()
            },
            iconChevronBottom(),
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
      filterLabels.map((label) => createClickableLabel(model, label))
    ]),
    h('tr', [
      h('td.relative',
        model.log.focus.timestampSince && datePicker(model, model.log.filter.criterias.timestamp.$since),
        h('input.form-control', {type: 'text', onfocus: () => model.log.setFocus('timestampSince', true), onblur: () => model.log.setFocus('timestampSince', false), oninput: (e) => model.log.setCriteria('timestamp', 'since', e.target.value), placeholder: 'from', value: model.log.filter.criterias.timestamp.since})),
      filterLabels.map((label) => createInputField(model.log, label.toLowerCase(), 'match')),
    ]),
    h('tr', [
      h('td.relative',
        model.log.focus.timestampUntil && datePicker(model, model.log.filter.criterias.timestamp.$until),
        h('input.form-control', {type: 'text', onfocus: () => model.log.setFocus('timestampUntil', true), onblur: () => model.log.setFocus('timestampUntil', false), oninput: (e) => model.log.setCriteria('timestamp', 'until', e.target.value), placeholder: 'to', value: model.log.filter.criterias.timestamp.until})),
      filterLabels.map((label) => createInputField(model.log, label.toLowerCase(), 'exclude')),
    ])
  ])
]);

/**
 * Method to create a clickable label within a td element
 * @param {object} model
 * @param {string} label
 * @return {vnode}
 */
const createClickableLabel = (model, label) => h('td', h('button.btn.w-100', {
  className: model.table.colsHeader[label.toLowerCase()].visible ? 'active' : '',
  onclick: () => model.table.toggleColumn(label.toLowerCase())
}, label));

/**
* Generate a match input field within a td element
* @param {object} log
* @param {string} field
* @param {string} command
* @return {vnode}
*/
const createInputField = (log, field, command) => h('td', h('input.form-control', {
  type: 'text',
  oninput: (e) => log.setCriteria(field, command, e.target.value),
  value: log.filter.criterias[field][command].slice(),
  placeholder: field === 'hostname' ? command : ''
}));
