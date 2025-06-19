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

import { filterInput, dynamicSelector } from './filter.js';
import { FilterType } from './filterTypes.js';
import { filtersConfig } from './filtersConfig.js';
import { h, iconChevronBottom, iconChevronTop } from '/js/src/index.js';

/**
 * Creates an input element for a specific metadata field;
 * @param {object} config - The configuration for this particular field
 * @param {object} filterMap - An object that contains the keys and values of the filters
 * @param {Function} onInputCallback - A callback function that triggers upon Input
 * @param {Function} onEnterCallback - A callback function that triggers upon Enter
 * @param {Function} onChangeCallback - A callback function that triggers upon Change
 * @returns {undefined}
 */
const createFilterElement = (config, filterMap, onInputCallback, onEnterCallback, onChangeCallback) => {
  const { type, queryLabel, placeholder, id, inputType = 'text', options } = config;
  const commonConfig = {
    queryLabel,
    placeholder,
    id,
    filterMap,
    onInputCallback,
    onEnterCallback,
  };

  switch (type) {
    case FilterType.INPUT: return filterInput({ ...commonConfig, type: inputType });
    case FilterType.DROPDOWN: return dynamicSelector({ ...commonConfig, options, onChangeCallback });
    default: return null;
  }
};

/**
 * Builds a panel containing multiple filters to allow user to apply for objectTree show/view
 * @param {FilterModel} filterModel - Model that manages filter state
 * @param {PageModel} pageModel - Model that manages the state of the page that the filter is on.
 * @returns {vnode} - virtual node element
 */
export function filtersPanel(filterModel, pageModel) {
  const { filterMap, setFilterValue, filterService, isVisible, clearFilter } = filterModel;
  const onInputCallback = setFilterValue.bind(filterModel);
  const onChangeCallback = setFilterValue.bind(filterModel);
  const onEnterCallback = () => filterModel.triggerFilter(pageModel);
  const clearFilterCallback = clearFilter.bind(filterModel);
  const filtersList = filtersConfig(filterService);

  if (!isVisible) {
    return null;
  }

  return h(
    '.w-100.flex-row.p2.g2.justify-center#filterElement',
    [
      triggerFiltersButton(onEnterCallback),
      clearFiltersButton(clearFilterCallback),
      ...filtersList.map((filter) =>
        createFilterElement(filter, filterMap, onInputCallback, onEnterCallback, onChangeCallback)),
    ],
  );
};

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {Function} onClickCallback - Function to trigger the filter mechanism
 * @returns {vnode} - virtual node element
 */
const triggerFiltersButton = (onClickCallback) =>
  h('button.btn.btn-primary#triggerFilterButton', { onclick: onClickCallback, title: 'Update filters' }, 'Update');

/**
 * Button which will allow the user to clear the filter element
 * @param {Function} clearFilterCallback - Function that clears the filter state.
 * @returns {vnode} - virtual node element
 */
const clearFiltersButton = (clearFilterCallback) =>
  h('button.btn.btn-secondary#clearFilterButton', { onclick: clearFilterCallback, title: 'Clear filters' }, 'Clear');

/**
 * Button for toggling visibility of the filter by parameters panel
 * @param {FilterModel} filterModel - model that manages filter state
 * @returns {vnode} - virtual node element
 */
export function filterPanelToggleButton(filterModel) {
  const { isVisible } = filterModel;
  return h(`button.btn.btn-default${isVisible ? '.active' : ''}`, {
    onclick: () => filterModel.toggleFilterVisibility(),
  }, ['Filters ', isVisible ? iconChevronTop() : iconChevronBottom()]);
}
