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

import { FILTER_TYPE } from './filterTypes.js';
import { h } from '/js/src/index.js';

/**
 * Builds a filter element. If there options to show, it builds a selector filter element, otherwise an input element.
 * @param {string} width - size of the filter
 * @param {string} queryLabel - value that is to be used in querying storage with this parameter
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} type - type of the filter,
 * @param {FILTER_TYPE} filterType - type of the filter
 * @param {string} value - value of the input text field
 * @param {RemoteData} options - list of available options to be shown
 * @param {Function} onChangeCallback - callback for onchange event
 * @param {Function} onInputCallback - callback for oninput event
 * @param {Function} onEnterCallback - callback for pressing enter on filter input
 * @returns {vnode} - virtual node element
 */
const autoSelector = (
  queryLabel,
  placeholder,
  key,
  value,
  options,
  onChangeCallback,
  onInputCallback,
  onEnterCallback,
  filterType = 'basicSelector',
  type = 'text',
  width = 'w-20',
) => {
  const renderFilterInput = () =>
    filterInput(queryLabel, placeholder, key, value, onInputCallback, onEnterCallback, type, width);

  return options.match({
    Success: (optionsList) => {
      if (optionsList.length === 0) {
        return renderFilterInput();
      }

      if (filterType === FILTER_TYPE.BASIC_SELECTOR) {
        return basicSelector(queryLabel, placeholder, key, value, optionsList, onChangeCallback, width);
      }
    },
    Other: renderFilterInput,
  });
};

/**
 * Builds a filter element that will allow the user to specify a parameter that should be applied when querying objects
 * @param width - size of the filter
 * @param {string} queryLabel - value that is to be used in querying storage with this parameter
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} type - type of the filter
 * @param {string} value - value of the input text field
 * @param {Function} onInputCallback - callback for oninput event
 * @param {Function} onEnterCallback - callback for pressing enter on filter input
 * @returns {vnode} - virtual node element
 */
const filterInput =
    (queryLabel, placeholder, key, value, onInputCallback, onEnterCallback, type = 'text', width = 'w-20') =>
      h(`${width}`, [
        h('input.form-control', {
          type,
          placeholder,
          id: key,
          name: key,
          min: 0,
          value: value[queryLabel],
          oninput: (event) => onInputCallback(queryLabel, event.target.value),
          onkeydown: ({ keyCode }) => {
            if (keyCode === 13) {
              onEnterCallback();
            }
          },
        }),
      ]);

/**
 *
 * Builds a filter selector element that will allow to select a parameter that should be applied when querying objects
 * @param {string} width - size of the filter
 * @param {string} queryLabel - label to be used when querying storage service
 * @param {string} placeholder - value to be placed as holder for input
 * @param {string} key - string to be used as unique id
 * @param {string} value - value of the input text field
 * @param {Array<string>} options - list of available options to be shown
 * @param {Function} onChangeCallback - callback for oninput event
 * @returns {vnode} - virtual node element
 */
const basicSelector =
    (queryLabel, placeholder, key, value, options, onChangeCallback, width = 'w-20') =>
      h(`${width}`, [
        h('select.form-control', {
          placeholder,
          id: key,
          name: key,
          value: options.map(String).includes(String(value[queryLabel])) ? String(value[queryLabel]) : '',
          onchange: (event) => onChangeCallback(event.target.value, queryLabel),
        }, [
          h('option', { value: '' }, placeholder),
          h('hr'),
          ...options.map((option) => h('option', { value: option }, option)),
        ]),
      ]);

export const filters = {
  filterInput,
  autoSelector,
};
