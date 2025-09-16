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
import { filtersConfig, runModeFilterConfig } from './filtersConfig.js';
import { runModeCheckbox } from './runMode/runModeCheckbox.js';
import { runStatusPanel } from './runMode/runStatusPanel.js';
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
  const { type, queryLabel, placeholder, id, inputType = 'text', options, width } = config;
  const commonConfig = {
    queryLabel,
    placeholder,
    id,
    filterMap,
    onInputCallback,
    onEnterCallback,
    width,
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
 * @param {object} viewModel - Model that manages the state of the page that the filter is on.
 * @returns {vnode} - virtual node element
 */
export function filtersPanel(filterModel, viewModel) {
  const {
    filterMap,
    setFilterValue,
    filterService,
    clearFilter,
    isRunModeActivated,
    runNumber,
    runStatus,
    isVisible,
    lastRefresh,
    ONGOING_RUN_INTERVAL_MS: refreshRate,
  } = filterModel;
  const onInputCallback = setFilterValue.bind(filterModel);
  const onChangeCallback = setFilterValue.bind(filterModel);
  const onEnterCallback = () => filterModel.triggerFilter(viewModel);
  const clearFilterCallback = clearFilter.bind(filterModel, viewModel);
  if (!isVisible) {
    return null;
  }
  const filtersList = isRunModeActivated
    ? runModeFilterConfig()
    : filtersConfig(filterService);

  return h(
    '.w-100.flex-column.p2.g2.justify-center#filterElement',
    [
      h('.flex-row.g2.justify-center', [
        runModeCheckbox(filterModel, viewModel),

        isRunModeActivated
          ? [
            ...filtersList.map((filter) =>
              createFilterElement(filter, filterMap, onInputCallback, onEnterCallback, onChangeCallback)),
            triggerFiltersButton(onEnterCallback, filterModel),

          ]
          : [
            triggerFiltersButton(onEnterCallback, filterModel),
            clearFiltersButton(clearFilterCallback),
            ...filtersList.map((filter) =>
              createFilterElement(filter, filterMap, onInputCallback, onEnterCallback, onChangeCallback)),
          ],
      ]),
      isRunModeActivated
      && runStatusPanel({ runNumber, runStatus, lastRefresh, refreshRate }),
    ],
  );
};

/**
 * Determines if runs mode is allowed based on current page and context
 * @param {object} viewModel - Model that manages the state of the page
 * @returns {boolean} - whether runs mode is allowed
 */

/**
 * Button which will allow the user to update filter parameters after the input
 * @param {Function} onClickCallback - Function to trigger the filter mechanism
 * @param {FilterModel} filterModel - Model that manages filter state
 * @returns {vnode} - virtual node element
 */
const triggerFiltersButton = (onClickCallback, filterModel) => {
  const isRunModeActivated = filterModel?.isRunModeActivated;
  let shouldDisable = false;
  const runNumber = filterModel?.filterMap?.RunNumber;
  let title = '';

  if (isRunModeActivated) {
    const { isValid, title: validationTitle } = validateRunNumber(runNumber);
    shouldDisable = !isValid;
    title = validationTitle;
  } else {
    title = 'Update filters';
  }
  const buttonId = isRunModeActivated ? 'updateAndRunModeButton' : 'triggerFilterButton';
  const buttonText = isRunModeActivated ? 'Update & Run Mode' : 'Update';

  return h(
    'button.btn.btn-primary',
    {
      id: buttonId,
      onclick: shouldDisable ? null : onClickCallback,
      disabled: shouldDisable,
      title,
    },
    buttonText,
  );
};

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

/**
 * Validates a run number for run mode.
 * @param {string} runNumber - The run number to validate.
 * @returns {{ isValid: boolean, title: string }} An object indicating
 *          whether the run number is valid and a corresponding message.
 */
function validateRunNumber(runNumber) {
  if (runNumber === undefined || runNumber === null || runNumber === '') {
    return { isValid: false, title: 'Run number is required' };
  }
  if (isNaN(runNumber)) {
    return { isValid: false, title: 'Run number must be a valid number' };
  }
  if (!Number.isInteger(Number(runNumber))) {
    return { isValid: false, title: 'Run number must be an integer' };
  }
  if (Number(runNumber) > 999999) {
    return { isValid: false, title: 'Run number must be 999999 or less' };
  }
  return { isValid: true, title: 'Update filters and activate run mode' };
};
