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

import { FilterType } from './filterTypes.js';
import { h, RemoteData } from '/js/src/index.js';

/**
 * Builds a filter element. If options to show, selector filter element; otherwise, input element.
 * @param {object} config - Configuration object for building the filter element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {RemoteData} [config.options=RemoteData.notAsked()] - List of options for a dropdown selector (optional).
 * @param {Function} config.onChangeCallback - Callback to be triggered on the change event of the filter.
 * @param {Function} config.onInputCallback - Callback to be triggered on the input event.
 * @param {Function} config.onEnterCallback - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.filterType=FilterType.DROPDOWN] - The type of filter to be used.
 * @param {string} [config.width='.'] - The CSS class that defines the width of the filter.
 * @returns {vnode} - A virtual node element representing the filter element (input or dropdown).
 */
const dynamicSelector = (config) => {
  const {
    queryLabel,
    placeholder,
    id, filterMap,
    options = RemoteData.notAsked(),
    onChangeCallback,
    onInputCallback,
    onEnterCallback,
    filterType = FilterType.DROPDOWN,
    type = 'text',
    width = '.w-20',
  } = config;

  const renderFilterInput = () =>
    filterInput({ queryLabel, placeholder, id, filterMap, onInputCallback, onEnterCallback, type, width });

  return options.match({
    Success: (optionsList) => {
      if (filterType === FilterType.DROPDOWN && optionsList.length > 0) {
        return dropdownSelector({
          queryLabel, placeholder, id, filterMap, options: optionsList, onChangeCallback, width,
        });
      }
      return renderFilterInput();
    },
    Other: renderFilterInput,
  });
};

/**
 * Builds a filter input element that allows the user to specify a parameter to be used when querying objects.
 * This function renders a text input element with event handling for input and Enter key press.
 * @param {object} config - Configuration object for building the filter input element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {Function} config.onInputCallback - Callback to be triggered on the input event.
 * @param {Function} config.onEnterCallback - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the filter.
 * @returns {vnode} - A virtual node element representing the filter input.
 */
const filterInput = (config) => {
  const { queryLabel, placeholder, id, filterMap, onInputCallback, onEnterCallback, type, width = '.w-20' } = config;

  return h(`${width}`, [
    h('input.form-control', {
      type,
      placeholder,
      id,
      name: id,
      min: 0,
      value: filterMap[queryLabel] || '',
      oninput: (event) => onInputCallback(queryLabel, event.target.value),
      onkeydown: ({ keyCode }) => {
        if (keyCode === 13) {
          onEnterCallback();
        }
      },
    }),
  ]);
};

/**
 * Builds a dropdown selector element that allows the user to select a parameter to be used when querying objects.
 * This function renders a `<select>` element with options that can be dynamically generated.
 * @param {object} config - Configuration object for building the dropdown selector element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the dropdown.
 * @param {string} config.id - The unique identifier for the select field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {Array<string>} config.options - List of available options to be shown in the dropdown.
 * @param {Function} config.onChangeCallback - Callback to be triggered on the change event of the selector.
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the dropdown.
 * @returns {vnode} - A virtual node element representing the dropdown selector.
 */
const dropdownSelector = (config) => {
  const { queryLabel, placeholder, id, filterMap, options, onChangeCallback, width = '.w-20' } = config;
  const optionSelected = filterMap[queryLabel];
  const setUrl = true;

  const validValue = options.map(String).includes(String(optionSelected));

  if (optionSelected && !validValue) {
    onChangeCallback(queryLabel, '', setUrl);
  }
  return h(`${width}`, [
    h('select.form-control', {
      placeholder,
      id,
      name: id,
      value: validValue ? optionSelected : '',
      onchange: (event) => onChangeCallback(queryLabel, event.target.value, setUrl),
    }, [
      h('option', { value: '' }, placeholder),
      h('hr'),
      ...options.map((option) => h('option', { value: option }, option)),
    ]),
  ]);
};

export const filters = {
  filterInput,
  dynamicSelector,
};
