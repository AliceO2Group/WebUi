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

import { TextField } from '@mui/material';
import { type ReactElement } from 'react';
import { Controller } from 'react-hook-form';
import type { WidgetProps } from '../Widget';

interface FormTextInputProps extends Omit<WidgetProps, 'type' | 'value'> {
  isDirty: boolean;
}

/**
 * Text input widget for the form.
 * @param {FormTextInputProps} props - The props of the widget.
 * @param {string} props.sectionTitle  - The section title of the widget.
 * @param {string} props.label - The title of the widget.
 * @param {Control<InputsType>} props.control - The control of the widget.
 * @returns {ReactElement} The text input widget.
 */
export const FormTextInput = ({
  sectionPrefix,
  label,
  control,
  isDirty,
}: FormTextInputProps): ReactElement => (
  <Controller
    name={sectionPrefix}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        type="text"
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
