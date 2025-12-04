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

import { FormSelect } from './form-select';
import { checkIsComponentOfType } from '~/utils/component-type-checker';

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
  const arrChildren = React.Children.toArray(children);
  const selects = arrChildren.filter((component) => checkIsComponentOfType(component, FormSelect));
  const optionsList = selects.map((select) => React.isValidElement(select) ? (select.props as SelectInterface).options : null);
  const values = selects.map((select) => React.isValidElement(select) ? (select.props as SelectInterface).value : null);

  const returnChildren = [];
  const noSelects = selects.length;

  for (let i = 0; i < noSelects; i++) {
    let select = selects[i];
    let options = optionsList[i];

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
