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
import objectTreeSidebar from './objectTreeSidebar.js';

/**
 * Creates a panel used for adding settings specific to a layout only
 * * should timestamps be displayed all the time
 * * tabs auto-change interval (0 no, 10 - 600 yes)
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
export default (model) =>
  h('.br1.w-100.flex-column.ph2.f6.h-100', [
    h('.w-100.f4.text-center', 'Configure your layout'),
    h('hr.w-100'),
    descriptionLayoutInput(
      model.layout.item.description,
      (e)=> model.layout.setLayoutProperty('description', e.target.value),
    ),
    displayObjectTime(model),
    displayAutoTabTimeSelector(model),
    h('hr.w-100'),
    objectTreeSidebar(model),
  ]);

/**
 * Build an input box, allowing users to add description
 * @param {string} description - description of the layout
 * @param {Function} oninput - function to be executed when there is input change
 * @returns {vnode} - virtual node element
 */
const descriptionLayoutInput = (description, oninput) => h('.w-100.flex-row', [
  h('.w-40', {
    id: 'inputDescriptionLabel',
  }, 'Description'),
  h('input.form-control.w-60', {
    type: 'text',
    value: description ?? '',
    placeholder: '100 characters max',
    for: 'inputDescriptionLabel',
    id: 'inputDescription',
    oninput,
  }),
]);

/**
 * Panel allowing users to select if object date/time info should be displayed
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const displayObjectTime = (model) =>
  h('.w-100.flex-row', [
    h(
      '.w-80',
      h('label.form-check-label', {
        for: 'inputShowTimestamp',
        style: 'cursor: pointer',
      }, 'Display timestamp on each plot'),
    ),
    h(
      '.w-20.text-right',
      h('input', {
        type: 'checkbox',
        id: 'inputShowTimestamp',
        checked: model.layout.item.displayTimestamp,
        onchange: (e) => model.layout.setLayoutProperty('displayTimestamp', e.target.checked),
      }),
    ),
  ]);

/**
 * Panel allowing users to input a numerical value (seconds) based on which the GUI should move the view to the next tab
 * Allowed values:
 * * 0 (OFF);
 * * 10-600 (ON);
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const displayAutoTabTimeSelector = (model) =>
  h('.w-100.flex-row', [
    h(
      '.w-80.flex-row.items-center',
      h('label.form-check-label', {}, 'Tab Auto-Change(sec): 0 (OFF), 10-600 (ON)'),
    ),
    h(
      '.w-20.text-right',
      h('input.form-control', {
        id: 'inputChangeTabTimer',
        type: 'number',
        value: model.layout.item.autoTabChange,
        min: 0,
        max: 600,
        onchange: (e) => {
          const time = e.target.value >= 10 ? e.target.value : 0;
          model.layout.setLayoutProperty('autoTabChange', time);
        },
      }),
    ),
  ]);
