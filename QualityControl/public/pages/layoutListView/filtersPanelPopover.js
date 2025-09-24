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

// Adopted from Bookkeeping/lib/public/components/Filters/common/filtersPanelPopover.js
import { h, popover, PopoverAnchors, PopoverTriggerPreConfiguration } from '/js/src/index.js';

/**
 * imports for JSDoc + VSCode navigation:
 * @import SearchFilterModel from './model/SearchFilterModel.js';
 */

/**
 * Return the filters panel popover trigger
 * @returns {Component} the button component
 */
const filtersToggleTrigger = () => h('button#openFilterToggle.btn.btn.btn-primary', 'Filters');

/**
 * Create main header of the filters panel
 * @param {SearchFilterModel} searchFilterModel {@link SearchFilterModel} filtering model.
 * @returns {Component} main panel header.
 */
const filtersToggleContentHeader = (searchFilterModel) => h('.flex-row.justify-between', [
  h('.f4', 'Filters'),
  h(
    'button#reset-filters.btn.btn-danger',
    {
      onclick: () => searchFilterModel.resetAll(),
      disabled: searchFilterModel.allInactive() ? true : false,
    },
    'Reset all filters',
  ),
]);

/**
 * Return the filters panel popover content section
 * @param {SearchFilterModel} searchFilterModel the searchFilter model
 * @returns {Component} the filters section
 */
export const filtersSection = (searchFilterModel = {}) => [
  searchFilterModel.getAll().flatMap((filter) => [
    h('.flex-row.g2', [
      h('.w-30.f5.flex-row.items-center.g2', filter.friendlyName()),
      h('.w-70', [
        h('input.form-control.w-100', {
          placeholder: filter.inputPlaceholder(),
          type: 'text',
          value: filter.getValue(),
          onchange: (e) => searchFilterModel.setValue(filter.key, e.target.value),
        }),
      ]),
    ]),
  ]),
];

/**
 * Return the filters panel popover content (i.e. the actual filters)
 * @param {SearchFilterModel} searchFilterModel the filtering model
 * @returns {Component} the filters panel
 */
const filtersToggleContent = (searchFilterModel) => h('.w-l.flex-column.p3.g3', [
  filtersToggleContentHeader(searchFilterModel),
  filtersSection(searchFilterModel),
]);

/**
 * Return component composed of the filtering popover and its button trigger
 * @param {SearchFilterModel} searchFilterModel the filtering model
 * @returns {Component} the filter component
 */
export const filtersPanelPopover = (searchFilterModel) => popover(
  filtersToggleTrigger(),
  filtersToggleContent(searchFilterModel),
  {
    ...PopoverTriggerPreConfiguration.click,
    anchor: PopoverAnchors.RIGHT_START,
  },
);
