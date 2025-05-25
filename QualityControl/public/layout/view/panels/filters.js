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
 * Builds a panel containing multiple filters to allow user to apply for layout show/view
 * @param {Model} model - root model of the application
 * @returns {vnode} - virtual node element
 */
const layoutFiltersPanel = ({ layout: layoutModel }) => {
  const { filter: filterMap, setFilterValue, applyLayoutChanges, selectOption } = layoutModel;
  const { filterInput, dynamicSelector } = filters;
  const onInputCallback = setFilterValue.bind(layoutModel);
  const onEnterCallback = applyLayoutChanges.bind(layoutModel);
  const onChangeCallback = selectOption.bind(layoutModel);
  const filterService = layoutModel.model.services.filter;
  const filtersList = filtersConfig(filterService) || [];
  const createFilterElement = (config) => {
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

  return h(
    '.w-100.flex-row.p2.g2',
    {
      onremove: () => {
        layoutModel.filter = {};
      } },
    [
      updateFiltersButton(layoutModel),
      ...filtersList.map(createFilterElement),
    ],
  );
};

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {LayoutModel} layoutModel - root model of the application
 * @returns {vnode} - virtual node element
 */
const updateFiltersButton = (layoutModel) => h('', h('button.btn.btn-primary', {
  onclick: () => layoutModel.applyLayoutChanges(),
}, 'Update'));

export { layoutFiltersPanel };
