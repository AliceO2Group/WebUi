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

import { type FC, type PropsWithChildren, type ReactElement } from 'react';
import { useFormState, type Control } from 'react-hook-form';
import type { InputsType } from '~/routes/configuration';
import { FormTextInput } from './widgets/FormTextInput';
import { FormToggleInput } from './widgets/FormToggleInput';
import type { FormPrimitiveValue, PrimitiveRestrictions } from '../types';

export interface WidgetProps extends PropsWithChildren {
  sectionPrefix: string;
  label: string;
  type: PrimitiveRestrictions;
  value: FormPrimitiveValue;
  control: Control<InputsType>;
}

/**
 * Widget component.
 * @param {WidgetProps} props - The props of the widget.
 * @param {string} props.type - The type of the widget.
 * @param {string} props.label - The label of the widget.
 * @param {unknown} props.value - The value of the widget.
 * @param {Control<InputsType>} props.control - The control of the widget.
 * @returns {ReactElement} The widget component.
 */
export const Widget: FC<WidgetProps> = ({ type, ...rest }): ReactElement => {
  const { dirtyFields } = useFormState({ control: rest.control });
  const isDirty = dirtyFields[rest.sectionPrefix];
  switch (type) {
    case 'string':
      return <FormTextInput {...rest} isDirty={Boolean(isDirty)} />;
    case 'number':
      return <FormTextInput {...rest} isDirty={Boolean(isDirty)} type="number" />;
    case 'boolean':
      return <FormToggleInput {...rest} isDirty={Boolean(isDirty)} />;
    default:
      return <>unknown widget type: {JSON.stringify(type)}</>;
  }
};
