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

import { h } from '/js/src/index.js';

/**
 * Form too edit properties of an object, this fits well inside the sidebar
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default function objectPropertiesSidebar(model) {
  const tabObject = model.layout.editingTabObject;

  return h('.p2', [
    h('div', 'Size'),
    h('.p3', [
      [...Array(model.layout.tab.columns)].map((_, index) =>
        h('.flex-row', [
          [...Array(model.layout.tab.columns)].map((_, indexButton) =>
            btnSize(model, tabObject, index + 1, indexButton + 1), ' '),
        ])),
    ]),

    h('hr'),

    h('.flex-row', [
      h('span', 'Object Configuration:'),
      btnIgnoreOptions(model, tabObject),
    ]),
    h('.ph3', [
      h(
        '.flex-row',
        h('.tooltip.mv2', [
          h('label.m0', 'Drawing Options:'),
          h('.tooltiptext', ' ROOT draw options'),
        ]),
      ),
      h('.flex-row.flex-wrap', [
        btnOption(model, tabObject, 'lego'),
        ' ',
        btnOption(model, tabObject, 'colz'),
        ' ',
        btnOption(model, tabObject, 'lcolz'),
        ' ',
        btnOption(model, tabObject, 'text'),
        ' ',
      ]),
      h(
        '.flex-row',
        h('.tooltip.mv2', [
          h('label.m0', 'Display Hints:'),
          h('.tooltiptext', 'Canvas options'),
        ]),
      ),
      h('.flex-row', [
        btnOption(model, tabObject, 'logx'),
        ' ',
        btnOption(model, tabObject, 'logy'),
        ' ',
        btnOption(model, tabObject, 'logz'),
        ' ',
      ]),
      h('.flex-row', [
        btnOption(model, tabObject, 'gridx'),
        ' ',
        btnOption(model, tabObject, 'gridy'),
        ' ',
        btnOption(model, tabObject, 'gridz'),
        ' ',
      ]),
      h('.flex-row', [btnOption(model, tabObject, 'stat'), ' ']),
    ]),

    h('hr'),

    h('p.f6.text-center', `Object name: ${tabObject.name}`),
    h('.text-center', [
      h('button.btn', { onclick: () => model.layout.editTabObject(null) }, 'Back to object tree'),
      ' ',
      h('button.btn.btn-danger', { onclick: () => model.layout.deleteTabObject(tabObject) }, 'Delete this object'),
    ]),

    h('hr'),
  ]);
}

/**
 * Shows a button to change size width and height e.g.: "1x3"
 * @param {Model} model - root model of the application
 * @param {object} tabObject - the tabObject to be changed
 * @param {number} width - size the button will handle
 * @param {number} height - size the button will handle
 * @returns {vnode} - virtual node element
 */
const btnSize = (model, tabObject, width, height) => h('.form-check.w-33', [
  h('input.form-check-input', {
    type: 'radio',
    id: tabObject.id + width + height,
    checked: tabObject.w === width && tabObject.h === height,
    onchange: () => model.layout.resizeTabObject(tabObject, width, height),
  }),
  h('label', { for: tabObject.id + width + height }, `${width}x${height}`),
]);

/**
 * Shows a button to toggle a jsroot option like grid or scale
 * @param {Model} model - root model of the application
 * @param {object} tabObject - the tabOject to be changed
 * @param {string} option - jsroot option
 * @returns {vnode} - virtual node element
 */
const btnOption = (model, tabObject, option) => h('.form-check.w-33', [
  h('input.form-check-input', {
    type: 'checkbox',
    id: tabObject.id + option,
    checked: (tabObject.options || []).indexOf(option) >= 0,
    onchange: () => model.layout.toggleTabObjectOption(tabObject, option),
  }),
  h('label', { for: tabObject.id + option }, option),
]);

/**
 * Button to ignore all C++ default histogram options
 * @param {Model} model - root model of the application
 * @param {object} tabObject - the tabOject to be changed
 * @returns {vnode} - virtual node element
 */
const btnIgnoreOptions = (model, tabObject) =>
  h('.flex-row.flex-grow', { style: 'justify-content: flex-end' }, h('.form-check.tooltip', [
    h('input.form-check-input', {
      type: 'checkbox',
      id: `${tabObject.id}defaults`,
      checked: tabObject.ignoreDefaults,
      onchange: () => model.layout.toggleDefaultOptions(tabObject),
    }),
    h('label.m0', { for: `${tabObject.id}defaults` }, 'Ignore defaults'),
    h('span.tooltiptext', 'Set on the histogram in ROOT - fOption and QC Metadata'),
  ]));
