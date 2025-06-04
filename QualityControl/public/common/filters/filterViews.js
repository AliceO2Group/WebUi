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

import { filters } from '../../../common/filters/filter.js';
import { FilterType } from '../../../common/filters/filterTypes.js';
import { filtersConfig } from './filtersConfig.js';
import { h } from '/js/src/index.js';

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
  const { filterInput, dynamicSelector } = filters;

  let filterElement = null;
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
    case FilterType.INPUT:
      filterElement = filterInput({ ...commonConfig, type: inputType });
      break;
    case FilterType.DROPDOWN:
      filterElement = dynamicSelector({ ...commonConfig, options, onChangeCallback });
      break;
    default:
      filterElement = null;
      break;
  }

  return filterElement ?? null;
};

/**
 * Builds a panel containing multiple filters to allow user to apply for layout show/view
 * @param {Layout} layoutModel - Model that manages layout state
 * @returns {vnode} - virtual node element
 */
const layoutFiltersPanel = (layoutModel) => {
  const { filter: filterMap, setFilterValue, applyLayoutChanges, selectOption } = layoutModel;
  const onInputCallback = setFilterValue.bind(layoutModel);
  const onEnterCallback = applyLayoutChanges.bind(layoutModel);
  const onChangeCallback = selectOption.bind(layoutModel);
  const filterService = layoutModel.model.services.filter;

  const filtersList = filtersConfig(filterService) || [];
  return h(
    '.w-100.flex-row.p2.g2.naka',
    {
      onremove: () => {
        layoutModel.filter = {};
      } },
    [
      triggerFiltersButton(onEnterCallback),
      ...filtersList.map((filter) =>
        createFilterElement(filter, filterMap, onInputCallback, onEnterCallback, onChangeCallback)),
    ],
  );
};

/**
 * Builds a panel containing multiple filters to allow user to apply for objectTree show/view
 * @param {QCObject} qcObject - Model that manages object state
 * @returns {vnode} - virtual node element
 */
const objectFiltersPanel = (qcObject) => {
  const { filter: filterMap, setFilterValue, selectOption, applyFilters } = qcObject;
  const onInputCallback = setFilterValue.bind(qcObject);
  const onEnterCallback = applyFilters.bind(qcObject);
  const onChangeCallback = selectOption.bind(qcObject);
  const filterService = qcObject.model.services.filter;
  const filtersList = filtersConfig(filterService) || [];

  return h(
    '.w-100.flex-row.p2.g2',
    {
      onremove: () => {
        qcObject.filter = {};
      } },
    [
      triggerFiltersButton(onEnterCallback),
      ...filtersList.map((filter) =>
        createFilterElement(filter, filterMap, onInputCallback, onEnterCallback, onChangeCallback)),
    ],
  );
};

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {Function} triggerFilter - Function to trigger the filter mechanism
 * @returns {vnode} - virtual node element
 */
const triggerFiltersButton = (triggerFilter) => h('', h('button.btn.btn-primary', {
  onclick: triggerFilter,
}, 'Update'));

export { layoutFiltersPanel, objectFiltersPanel };
