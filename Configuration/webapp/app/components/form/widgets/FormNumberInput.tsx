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

interface FormNumberInputProps extends Omit<WidgetProps, 'type' | 'value'> {
  isDirty: boolean;
}

import { Controller } from 'react-hook-form';
import type { WidgetProps } from '../Widget';
import { TextField } from '@mui/material';
import type { ReactElement } from 'react';

/**
 * Number input widget for the form.
 * @param {FormNumberInputProps} props - The props of the widget.
 * @param {string} props.sectionPrefix - The prefix of the section.
 * @param {string} props.label - The label of the widget.
 * @param {Control<InputsType>} props.control - The control of the widget.
 * @param {boolean} props.isDirty - Whether the widget is dirty.
 * @returns {ReactElement} The number input widget.
 */
export const FormNumberInput = ({
  sectionPrefix,
  label,
  control,
  isDirty,
}: FormNumberInputProps): ReactElement => (
  <Controller
    name={sectionPrefix}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        type="number"
        label={label}
        {...field}
        error={Boolean(error)}
        color={isDirty ? 'secondary' : 'primary'}
        focused={isDirty}
        helperText={error?.message}
      />
    )}
  />
);
