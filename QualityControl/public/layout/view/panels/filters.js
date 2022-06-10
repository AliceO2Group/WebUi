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

import {h} from '/js/src/index.js';

/**
 * Builds a panel containing multiple filters to allow user to apply for layout show/view
 * @param {Model} model
 * @returns {vnode}
 */
const layoutFiltersPanel = (model) => h('.p2.flex-row', {
  onremove: () => model.layout.filter = {},
}, [ // PeriodName, PassName, RunNumber, RunType
  filter(model, 'RunNumber', 'runNumberLayoutFilter', 'number', '.w-20'),
  filter(model, 'RunType', 'runTypeLayoutFilter', 'text', '.w-20'),
  filter(model, 'PeriodName', 'periodNameLayoutFilter', 'text', '.w-20'),
  filter(model, 'PassName', 'passNameLayoutFilter', 'text', '.w-20'),
  updateFiltersButton(model),
]);

/**
 * Builds a filter element that will allow the user to specify a field that should be applied when querying objects
 * @param {Model} model 
 * @param {String} placeholder 
 * @param {String} key 
 * @param {String} width 
 * @returns 
 */
const filter = (model, placeholder, key, type = 'text', width = '.w-10') => {
  return h(`${width}`,
    h('input.form-control', {
      type,
      placeholder,
      id: key,
      name: key,
      min: 0,
      oninput: (e) => {
        model.layout.filter[placeholder] = e.target.value;
        model.layout.notify();
      }
    })
  );
};

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {Model} model 
 * @returns {vnode}
 */
const updateFiltersButton = (model) => {
  return h('.w-20.text-right', h('button.btn.btn-primary', {
    onclick: () => model.layout.selectTab(0),
  }, 'Update'))
}

export {layoutFiltersPanel};