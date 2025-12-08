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

import React, { type PropsWithChildren } from 'react';
import type { SelectInterface } from './form.d';
import type { OptionType } from '~/utils/types';

import { FormSelect } from './form-select';
import { checkIsComponentOfType } from '~/utils/component-type-checker';

/**
 * Helper collectSelectsInfo
 *
 * Inspects children to collect FormSelect components and their options and values.
 *
 * @param {React.ReactNode} children - child nodes which may include FormSelect components
 *
 * @returns {object} - object containing:
 *   - selects: array of FormSelect components found among children
 *   - selectsLen: number of FormSelect components found
 *   - optionsList: array of options arrays for each FormSelect
 *   - values: array of selected values for each FormSelect
 */
function collectSelectsInfo(children: React.ReactNode) {
  const arrChildren = React.Children.toArray(children);
  const selects = arrChildren.filter((component) => checkIsComponentOfType(component, FormSelect));
  const optionsList = selects.map((select) => React.isValidElement(select) ? (select.props as SelectInterface).options : null);
  const values = selects.map((select) => React.isValidElement(select) ? (select.props as SelectInterface).value : null);
  const selectsLen = selects.length;

  return {
    selects,
    selectsLen,
    optionsList,
    values,
  };
}

type valuesType = (string | number | (string | number)[] | null)[];

/**
 * FilterSelectedFromOptions
 *
 * Clones select components with filtered options to remove already selected values from other selects.
 *
 * @param {React.ReactNode[]} selects - array of select components
 * @param {number} selectsLen - length of selects array
 * @param {(OptionType[] | null)[]} optionsList - array of options arrays for each select
 * @param {valuesType} values - array of selected values for each select
 *
 * @returns {React.ReactNode[]} - array of cloned select components with filtered options
 */
function filterSelectedFromOptions(selects: React.ReactNode[], selectsLen: number, optionsList: (OptionType[] | null)[], values: valuesType) {
  const returnChildren = [];

  for (let i = 0; i < selectsLen; i++) {
    let select = selects[i];
    let options = optionsList[i];

    // Get all values selected in other selects
    const differentSelectValues = values.filter((_, idx) => idx != i);

    if (options !== null) {
      options = options.filter((opt) => !differentSelectValues.includes(opt.value));
      select = React.cloneElement(select as React.ReactElement<SelectInterface>, {
        options: options,
      });
    }
    returnChildren.push(select);
  }

  return [...returnChildren];
}

/**
 * SelectGroup
 *
 * Inspects children and deduplicates options across FormSelect children by cloning them.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - child nodes which should only include FormSelect components;
 * SelectGroup will detect those and clone them with filtered options
 *
 * Behaviour notes:
 * - Looks for direct children of type FormSelect.
 * - Builds list of values used by other selects and removes them from each select's options to avoid duplicates.
 * - Clones and returns modified select children; non-select children are not displayed so they shouldn't be used.
 */
export function SelectGroup({ children }: PropsWithChildren) {
  const { selects, selectsLen, optionsList, values } = collectSelectsInfo(children);
  return filterSelectedFromOptions(selects, selectsLen, optionsList, values);
}
