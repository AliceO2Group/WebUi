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
 * Builds a panel containing multiple filters to allow user to apply for layout show/view
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const layoutFiltersPanel = (model) => h('.p2.flex-row.g2', {
  onremove: () => {
    model.layout.filter = {};
  },
}, [ // PeriodName, PassName, RunNumber, RunType
  updateFiltersButton(model),
  filter(model, 'RunNumber (e.g. 546783)', 'runNumberLayoutFilter', 'number', '.w-20'),
  filter(model, 'RunType (e.g. 2)', 'runTypeLayoutFilter', 'text', '.w-20'),
  filter(model, 'PeriodName (e.g. LHC23c)', 'periodNameLayoutFilter', 'text', '.w-20'),
  filter(model, 'PassName (e.g. apass2)', 'passNameLayoutFilter', 'text', '.w-20'),
]);

/**
 * Builds a filter element that will allow the user to specify a field that should be applied when querying objects
 * @param {Model} model - root model of the application
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} type - type of the filter
 * @param {string} width - size of the filter
 * @returns {vnode} - virtual node element
 */
const filter = (model, placeholder, key, type = 'text', width = '.w-10') =>
  h(`${width}`, [
    h('input.form-control', {
      type,
      placeholder,
      id: key,
      name: key,
      min: 0,
      value: model.layout.filter[placeholder],
      oninput: (e) => {
        if (e.target.value) {
          model.layout.filter[placeholder] = e.target.value;
        } else {
          delete model.layout.filter[placeholder];
        }
        model.layout.notify();
      },
    }),
  ]);

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const updateFiltersButton = (model) => h('', h('button.btn.btn-primary', {
  onclick: () => {
    model.layout.selectTab(model.layout.tabIndex);
    model.layout.setFilterToURL();
  },
}, 'Update'));

export { layoutFiltersPanel };
