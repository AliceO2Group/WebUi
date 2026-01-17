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
import { h, RemoteData, DropdownComponent } from '/js/src/index.js';

/**
 * Builds a filter element. If options to show, selector filter element; otherwise, input element.
 * @param {object} config - Configuration object for building the filter element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {RemoteData} [config.options=RemoteData.notAsked()] - List of options for a dropdown selector (optional).
 * @param {onchange} config.onChangeCallback - Callback to be triggered on the change event of the filter.
 * @param {oninput} config.onInputCallback - Callback to be triggered on the input event.
 * @param {onkeydown} config.onEnterCallback - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.filterType=FilterType.DROPDOWN] - The type of filter to be used.
 * @param {string} [config.width='.'] - The CSS class that defines the width of the filter.
 * @returns {vnode} - A virtual node element representing the filter element (input or dropdown).
 */
export const dynamicSelector = (config) => {
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
 * Represents options grouped for HTML <optgroup>.
 * Keys are group labels (for the <optgroup> label),
 * values are arrays of option values (for <option> elements).
 * @typedef {Record<string, string[]>} GroupedDropdownOptions
 */

/**
 * Builds a filter element. If options to show, selector filter element; otherwise, input element.
 * @param {object} config - Configuration object for building the filter element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {GroupedDropdownOptions} [config.options={}] - List of options for a grouped dropdown selector (optional).
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onChangeCallback
 * - Callback to be triggered on the change event of the filter.
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onInputCallback
 * - Callback to be triggered on the input event.
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onEnterCallback
 * - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the filter.
 * @returns {vnode} A virtual node element representing the filter element (input or grouped dropdown).
 */
export const groupedDropdownComponent = ({
  queryLabel,
  placeholder,
  id,
  filterMap,
  options = {},
  onChangeCallback,
  onInputCallback,
  onEnterCallback,
  type = 'text',
  width = '.w-20',
}) => {
  const groups = Object.keys(options);
  if (!groups.length) {
    return filterInput({ queryLabel, placeholder, id, filterMap, onInputCallback, onEnterCallback, type, width });
  }

  const selectedOption = filterMap[queryLabel];
  const validValue = Object.values(options).flat().some((option) => option === selectedOption);
  if (selectedOption && !validValue) {
    onChangeCallback(queryLabel, '', true);
  }

  const sortedGroupedOptions = groups
    .sort((a, b) => a.localeCompare(b)) // sort group labels
    .reduce((acc, key) => {
      // sort option names and add to accumulator
      acc[key] = [...options[key]].sort((a, b) => a.localeCompare(b));
      return acc;
    }, {});

  return h(`${width}`, [
    h('select.form-control', {
      placeholder,
      id,
      name: id,
      value: validValue ? selectedOption : '',
      onchange: (event) => onChangeCallback(queryLabel, event.target.value, true),
    }, [
      h('option', { value: '' }, placeholder),
      h('hr'),
      ...Object.entries(sortedGroupedOptions).map(([key, value]) => h(
        'optgroup',
        { label: key },
        value.map((option) => h('option', { value: option }, option)),
      )),
    ]),
  ]);
};

/**
 * Builds a filter element. If options to show, selector filter element; otherwise, input element.
 * @param {object} config - Configuration object for building the filter element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {Record<string, object>} [config.options={}] - List of options for an input with dropdown selector (optional).
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onChangeCallback
 * - Callback to be triggered on the change event of the filter.
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onInputCallback
 * - Callback to be triggered on the input event.
 * @param {(filterId: string, value: string, setUrl: boolean) => void} config.onEnterCallback
 * - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the filter.
 * @returns {vnode} A virtual node element representing the filter element.
 */
export const inputWithDropdownComponent = ({
  queryLabel,
  placeholder,
  id,
  filterMap,
  options = {},
  onChangeCallback,
  onInputCallback,
  onEnterCallback,
  type = 'text',
  width = '.w-20',
}) => {
  const dropdownOptions = Object.keys(options);
  if (!dropdownOptions.length) {
    return filterInput({ queryLabel, placeholder, id, filterMap, onInputCallback, onEnterCallback, type, width });
  }
  const dropdownComponent = DropdownComponent(
    filterInput({
      queryLabel,
      placeholder,
      id,
      filterMap,
      type,
      onInputCallback,
      onEnterCallback,
      width: '.w-100',
    }),
    h('', {
      id: `${queryLabel?.toLowerCase()}-dropdown`,
      style: 'max-height: 300px; overflow-y: auto;',
    }, Object.entries(options)
      .filter(([option]) => option.toLowerCase().includes(filterMap[queryLabel]?.toLowerCase() ?? ''))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([option, htmlOptions]) => h(
        'button.btn.d-block.w-100',
        {
          onclick: () => {
            onChangeCallback(queryLabel, option, true);
            dropdownComponent.state.hidePopover();
          },
          ...htmlOptions ?? {},
        },
        [option, Object.keys(htmlOptions).length > 0 ? ' (frozen)' : ''],
      ))),
  );

  return h(`${width}`, dropdownComponent);
};

/**
 * Builds a filter input element that allows the user to specify a parameter to be used when querying objects.
 * This function renders a text input element with event handling for input and Enter key press.
 * @param {object} config - Configuration object for building the filter input element.
 * @param {string} config.queryLabel - The key used to query the storage with this parameter.
 * @param {string} config.placeholder - The placeholder text to be displayed in the input field.
 * @param {string} config.id - The unique identifier for the input field.
 * @param {object} config.filterMap - Map of the current filter values.
 * @param {oninput} config.onInputCallback - Callback to be triggered on the input event.
 * @param {onkeydown} config.onEnterCallback - Callback to be triggered when the Enter key is pressed.
 * @param {string} [config.type='text'] - The type of the filter element (e.g., 'text', 'number').
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the filter.
 * @returns {vnode} - A virtual node element representing the filter input.
 */
export const filterInput = (config) => {
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
 * @param {onchange} config.onChangeCallback - Callback to be triggered on the change event of the selector.
 * @param {string} [config.width='.w-20'] - The CSS class that defines the width of the dropdown.
 * @returns {vnode} - A virtual node element representing the dropdown selector.
 */
const dropdownSelector = (config) => {
  const { queryLabel, placeholder, id, filterMap, options, onChangeCallback, width = '.w-20' } = config;
  const optionSelected = filterMap[queryLabel];
  const setUrl = false;

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

/**
 * Renders a dropdown selector for ongoing runs.
 * @param {object} config - Selector config ({ id, placeholder, width }).
 * @param {object} filterMap - Current filters (RunNumber or empty).
 * @param {RemoteData} options - Available ongoing runs.
 * @param {onchange} onChangeCallback - To change the selection and update the filterMap
 * @param {onkeydown} onEnterCallback - To trigger the filter
 * @param {onfocus} [onFocusCallback] - To retrieve ongoing runs
 * @returns {object} Virtual DOM node (hyperscript element).
 */
export const ongoingRunsSelector = (config, filterMap, options, onChangeCallback, onEnterCallback, onFocusCallback) => {
  const handleChange = (value) => {
    onChangeCallback('RunNumber', value, false);
    if (value) {
      setTimeout(() => onEnterCallback(), 50);
    }
  };
  const availableOptions = options.isSuccess()
    ? [...new Set([...options.payload].map((v) => String(v)))]
    : [];

  const selectedValue = filterMap['RunNumber'] || '';

  const handleFocus = () => {
    if (onFocusCallback) {
      onFocusCallback();
    }
  };

  const buildOptions = () => {
    const options = [];
    options.push(h('option', { value: '', disabled: true }, config.placeholder || 'Select a run'));
    if (selectedValue) {
      options.push(h('option', { value: selectedValue }, selectedValue));
    }

    availableOptions
      .filter((option) => option !== selectedValue)
      .forEach((option) => {
        options.push(h('option', { value: option }, option));
      });

    return options;
  };

  return h(`.${config.width}`, [
    h(
      'select.form-control',
      {
        placeholder: config.placeholder || 'Select a run',
        id: config.id,
        name: config.id,
        value: selectedValue,
        onfocus: handleFocus,
        onchange: (event) => handleChange(event.target.value),
      },
      availableOptions.length > 0 || selectedValue
        ? buildOptions()
        : [h('option', { value: '', disabled: true }, 'No ongoing runs available')],
    ),
  ]);
};
