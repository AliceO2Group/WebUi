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
import type { OptionType as Option } from '~/utils/types';
import type { SelectInterface } from './form.d';

import { FormSelect } from './form-select';

const checkIsComponentOfType = (c: React.ReactNode, otype: React.ElementType): boolean => React.isValidElement(c) && c.type === otype;

export const SelectGroup =  ({ children }: PropsWithChildren) => {
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
      options = options.filter((opt) => !differentSelectValues.includes(opt.value) );
      select = React.cloneElement(select as React.ReactElement<SelectInterface>, {
        options: options,
      });

    }
    returnChildren.push(select);
  }

  return [...returnChildren];

};
