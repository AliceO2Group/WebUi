/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/* eslint max-len: 0 */

import { h, iconChevronBottom } from '/js/src/index.js';

import datePicker from '../common/datePicker.js';
import { TIME_S, TIME_MS } from '../common/Timezone.js';

const filterLabels = [
  'Hostname',
  'Rolename',
  'PID',
  'Username',
  'System',
  'Facility',
  'Detector',
  'Partition',
  'Run',
  'ErrCode',
  'ErrLine',
  'ErrSource',
];

export default (model) => h('table.table-filters', [
  h('tbody', [
    h('tr', [
      h('td', [
        h('button.btn.w-50', {
          className: model.table.colsHeader.date.visible ? 'active' : '',
          onclick: () => model.table.toggleColumn('date'),
        }, 'Date'),
        h('.btn-group.w-50', [
          h('button.btn.w-75', {
            className: model.table.colsHeader.time.visible ? 'active' : '',
            onclick: () => model.table.toggleColumn('time'),
          }, 'Time'),
          h(
            'button.btn.dropdown.w-25',
            {
              className: model.log.isTimeDropdownEnabled ? 'dropdown-open active' : '',
              style: 'padding:0.1em',
              onclick: () => model.log.toggleTimeFormat(),
            },
            iconChevronBottom(),
            h('.dropdown-menu', [
              h('a.menu-item.text-ellipsis', {
                className: model.log.timeFormat === TIME_S ? 'selected' : '',
                onclick: () => {
                  model.log.timeFormat = TIME_S;
                  model.table.setColumnVisibility('time', true);
                },
              }, 'HH:mm:ss'),
              h('a.menu-item.text-ellipsis', {
                className: model.log.timeFormat === TIME_MS ? 'selected' : '',
                onclick: () => {
                  model.log.timeFormat = TIME_MS;
                  model.table.setColumnVisibility('time', true);
                },
              }, 'HH:mm:ss.SSS'),
            ]),
          ),
        ]),
      ]),
      filterLabels.map((label) => createClickableLabel(model, label)),
      createClickableLabel(model, 'Message'),
    ]),
    h('tr', [
      h(
        'td.relative',
        model.log.focus.timestampSince && datePicker(model, model.log.filter.criterias.timestamp.$since),
        h('input.form-control', {
          type: 'text',
          tabIndex: 1,
          onfocus: () => model.log.setFocus('timestampSince', true),
          onblur: () => model.log.setFocus('timestampSince', false),
          oninput: (e) => model.log.setCriteria('timestamp', 'since', e.target.value),
          placeholder: 'from',
          value: model.log.filter.criterias.timestamp.since,
        }),
      ),
      filterLabels.map((label, index) => createInputField(model.log, label.toLowerCase(), 'match', index + 2)),
      createTextAreaField(model, 'message', 'match', filterLabels.length + 2),

    ]),
    h('tr', [
      h(
        'td.relative',
        model.log.focus.timestampUntil && datePicker(model, model.log.filter.criterias.timestamp.$until),
        h('input.form-control', {
          type: 'text',
          tabIndex: 1,
          onfocus: () => model.log.setFocus('timestampUntil', true),
          onblur: () => model.log.setFocus('timestampUntil', false),
          oninput: (e) => model.log.setCriteria('timestamp', 'until', e.target.value),
          placeholder: 'to',
          value: model.log.filter.criterias.timestamp.until,
        }),
      ),
      filterLabels.map((label, index) => createInputField(model.log, label.toLowerCase(), 'exclude', index + 2)),
      createTextAreaField(model, 'message', 'exclude', filterLabels.length + 2),
    ]),
  ]),
]);

/**
 * Method to create a clickable label within a td element
 * @param {Model} model - root model of the application
 * @param {string} label - label to be displayed
 * @returns {vnode} - clickable label within a td element
 */
const createClickableLabel = (model, label) => h('td', h('button.btn.w-100', {
  className: model.table.colsHeader[label.toLowerCase()].visible ? 'active' : '',
  onclick: () => model.table.toggleColumn(label.toLowerCase()),
}, label));

/**
 * Generate a match input field within a td element
 * @param {Log} logModel - log model
 * @param {string} field - field to be filtered
 * @param {string} command - command to be executed
 * @param {number} tabIndex - value for order of the tab when using keyboard `tab` action
 * @returns {vnode} - input field within a td element
 */
const createInputField = (logModel, field, command, tabIndex = 1) => h('td', h('input.form-control', {
  type: 'text',
  tabIndex,
  oninput: (e) => logModel.setCriteria(field, command, e.target.value),
  value: logModel.filter.criterias[field][command].slice(),
  placeholder: field === 'hostname' ? command : '',
}));

/**
 * Generate a text area which onfocus will expand, allowing the user to easily input multiple lines of text
 * @param {Model} model - root model of the application
 * @param {string} field - field to be filtered
 * @param {string} command - command to be executed
 * @param {number} tabIndex - value for order of the tab when using keyboard `tab` action
 * @returns {vnode} - text area within a td element
 */
const createTextAreaField = (model, field, command, tabIndex) =>
  h('td', h('textarea.form-control.text-area-for-message', {
    style: 'height:2em; resize: none;',
    tabIndex,
    placeholder: !model.messageFocused
      ? ''
      : 'Include/Exclude multiple error messages separated by new line. ' +
        'To partially match a message, use the SQL wildcard \'%\' \n\n' +
        'e.g \n\n%[FMQ] IDLE ---> INITIALIZING DEVICE%\n' +
        'TASK %QC% running out of memory\n' +
        'weird error with strict message',
    onfocus: () => {
      model.messageFocused = true;
      model.notify();
    },
    onfocusout: () => {
      model.messageFocused = false;
      model.notify();
    },
    oninput: (e) => model.log.setCriteria(field, command, e.target.value.trim()),
    value: model.log.filter.criterias[field][command].slice(),
  }));
