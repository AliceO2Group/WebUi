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
const layoutFiltersPanel = ({ layout: layoutModel }) => h('.p2.flex-row.g2', {
  onremove: () => {
    layoutModel.filter = {};
  },
}, [ // PeriodName, PassName, RunNumber, RunType
  updateFiltersButton(layoutModel),
  filter(layoutModel, 'RunNumber', 'RunNumber (e.g. 546783)', 'runNumberLayoutFilter', 'number', '.w-20'),
  filter(layoutModel, 'RunType', 'RunType (e.g. 2)', 'runTypeLayoutFilter', 'text', '.w-20'),
  filter(layoutModel, 'PeriodName', 'PeriodName (e.g. LHC23c)', 'periodNameLayoutFilter', 'text', '.w-20'),
  filter(layoutModel, 'PassName', 'PassName (e.g. apass2)', 'passNameLayoutFilter', 'text', '.w-20'),
]);

/**
 * Builds a filter element that will allow the user to specify a field that should be applied when querying objects
 * @param {LayoutModel} layoutModel - root model of the application
 * @param {string} queryLabel - label to be used when querying storage service
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} type - type of the filter
 * @param {string} width - size of the filter
 * @returns {vnode} - virtual node element
 */
const filter = (layoutModel, queryLabel, placeholder, key, type = 'text', width = '.w-10') =>
  h(`${width}`, [
    h('input.form-control', {
      type,
      placeholder,
      id: key,
      name: key,
      min: 0,
      value: layoutModel.filter[queryLabel],
      oninput: (e) => {
        if (e.target.value) {
          layoutModel.filter[queryLabel] = e.target.value;
        } else {
          delete layoutModel.filter[queryLabel];
        }
        layoutModel.notify();
      },
      onkeydown: ({ keyCode }) => {
        if (keyCode === 13) {
          layoutModel.setFilterToURL();
          layoutModel.selectTab(layoutModel.tabIndex);
        }
      },
    }),
  ]);

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {LayoutModel} layoutModel - root model of the application
 * @returns {vnode} - virtual node element
 */
const updateFiltersButton = (layoutModel) => h('', h('button.btn.btn-primary', {
  onclick: () => {
    layoutModel.setFilterToURL();
    layoutModel.selectTab(layoutModel.tabIndex);
  },
}, 'Update'));

export { layoutFiltersPanel };
