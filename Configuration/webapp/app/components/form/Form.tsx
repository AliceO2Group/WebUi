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

import type { FC } from 'react';
import { Widget } from './components/Widget';
import { ArrayWidget } from './components/widgets/ArrayWidget';
import type {
  ArrayRestrictions,
  FormArrayValue,
  FormObjectValue,
  FormPrimitiveValue,
  FormValue,
  ObjectRestrictions,
  Restrictions,
} from './types';
import { isArrayRestrictions, isObjectRestrictions } from './types/helpers';
import { ObjectWidget } from './components/widgets/ObjectWidget';
import type { Control } from 'react-hook-form';
import type { InputsType } from '~/routes/configuration';
import { KEY_SEPARATOR } from './constants';

interface FormProps {
  sectionTitle: string;
  sectionPrefix: string;
  value: FormValue;
  restrictions: Restrictions | ObjectRestrictions | ArrayRestrictions;
  control: Control<InputsType>;
}

export const Form: FC<FormProps> = ({
  sectionTitle,
  sectionPrefix,
  value,
  restrictions,
  control,
}) => {
  if (isObjectRestrictions(restrictions)) {
    return (
      <ObjectWidget
        key={sectionTitle}
        sectionTitle={sectionTitle}
        sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${sectionTitle}`}
        items={value as FormObjectValue}
        itemsRestrictions={restrictions}
        control={control}
      />
    );
  }

  if (isArrayRestrictions(restrictions)) {
    return (
      <ArrayWidget
        key={sectionTitle}
        sectionTitle={sectionTitle}
        sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${sectionTitle}`}
        items={value as Array<FormArrayValue>}
        itemsRestrictions={restrictions}
        control={control}
      />
    );
  }

  return (
    <Widget
      key={sectionTitle}
      label={sectionTitle}
      sectionPrefix={`${sectionPrefix}${KEY_SEPARATOR}${sectionTitle}`}
      type={restrictions}
      value={value as FormPrimitiveValue}
      control={control}
    />
  );
};
