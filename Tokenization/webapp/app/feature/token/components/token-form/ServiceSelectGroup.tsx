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

import React from 'react';
import type { OptionType } from '~/utils/types';
import { SelectGroup } from '~/shared/components/form/select-group';
import { FormSelect } from '~/shared/components/form/form-select';

/**
 *
 */
export default function ServiceSelectGroup({
  serviceOptions,
  firstValue,
  secondValue,
  onFirstChange,
  onSecondChange,
}: {
  serviceOptions?: OptionType[];
  firstValue: string;
  secondValue: string;
  onFirstChange: React.Dispatch<React.SetStateAction<string>>;
  onSecondChange: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <SelectGroup>
      <FormSelect
        id="first-service-select"
        options={serviceOptions ?? []}
        value={firstValue}
        setValue={onFirstChange}
        placeholder="Select First Service..."
        label="First Service"
      />
      <FormSelect
        id="second-service-select"
        options={serviceOptions ?? []}
        value={secondValue}
        setValue={onSecondChange}
        placeholder="Select Second Service..."
        label="Second Service"
      />
    </SelectGroup>
  );
}
