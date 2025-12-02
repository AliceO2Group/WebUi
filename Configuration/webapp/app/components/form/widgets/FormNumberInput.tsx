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

import { Controller } from 'react-hook-form';
import type { WidgetProps } from '../Widget';
import { TextField } from '@mui/material';
import type { ReactElement } from 'react';

export const FormNumberInput = ({
  sectionPrefix,
  label,
  control,
}: Omit<WidgetProps, 'type' | 'value'>): ReactElement => (
  <Controller
    name={sectionPrefix}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        type="number"
        label={label}
        {...field}
        error={Boolean(error)}
        helperText={error?.message}
      />
    )}
  />
);
