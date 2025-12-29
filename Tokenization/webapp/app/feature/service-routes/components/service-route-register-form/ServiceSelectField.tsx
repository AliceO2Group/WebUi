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

import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { Controller, type Control } from 'react-hook-form';

import { StaticTextField } from '~/shared/components/form/static-text-field';

import type {
  ServiceOption,
  ServiceRouteCreationFormValues,
  ServiceSelectFieldName,
} from './types';

type ServiceSelectFieldProps = {
  control: Control<ServiceRouteCreationFormValues>;
  name: ServiceSelectFieldName;
  label: string;
  placeholder: string;
  options: ServiceOption[];
  inputValue: string;
  onInputValueChange: (value: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
  minSearchChars: number;
};

/**
 * Wraps the Autocomplete control used to pick the source or destination service.
 */
export function ServiceSelectField({
  control,
  name,
  label,
  placeholder,
  options,
  inputValue,
  onInputValueChange,
  isLoading,
  isDisabled,
  minSearchChars,
}: ServiceSelectFieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      rules={{ required: name === 'serviceFrom' ? 'Source service is required.' : 'Destination service is required.' }}
      render={({ field, fieldState }) => {
        const showMinCharsHint = !fieldState.error && inputValue.length < minSearchChars;
        const helperText = fieldState.error?.message ?? (showMinCharsHint ? `Type at least ${minSearchChars} characters` : undefined);

        return (
          <Autocomplete<ServiceOption, false, false, false>
            options={options}
            value={field.value ?? null}
            onChange={(_, option) => {
              field.onChange(option ?? null);
              onInputValueChange(option?.label ?? '');
            }}
            filterOptions={(autocompleteOptions) => autocompleteOptions}
            inputValue={inputValue}
            onInputChange={(_, value) => onInputValueChange(value)}
            loading={isLoading}
            disabled={isDisabled}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderInput={(params) => (
              <StaticTextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={Boolean(fieldState.error)}
                helperText={helperText}
                fullWidth
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        );
      }}
    />
  );
}
