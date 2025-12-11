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

/**
 * Generic multi-select field integrated with react-hook-form and Material UI Autocomplete.
 * Supports rendering any list of string options, displays a loading indicator, and
 * emits value changes back into the provided form control.
 */
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { Controller } from 'react-hook-form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { StaticTextField } from './styled-text-field';

export type FormMultiSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options: string[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
};

export const FormMultiSelectField = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options,
  loading = false,
  placeholder,
  className,
}: FormMultiSelectFieldProps<TFieldValues>) => (
  <Controller
    control={control}
    name={name}
    render={({ field }) => (
      <Autocomplete
        multiple
        options={options}
        value={field.value ?? []}
        onChange={(_, value) => field.onChange(value)}
        filterSelectedOptions
        loading={loading}
        className={className}
        renderInput={(params) => (
          <StaticTextField
            {...params}
            label={label}
            placeholder={placeholder}
            fullWidth
            slotProps={{
              input: {
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress color="inherit" size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              },
            }}
          />
        )}
      />
    )}
  />
);
