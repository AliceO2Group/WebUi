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
import { useMemo, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import { Controller } from 'react-hook-form';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { StaticTextField } from './static-text-field';

export type OptionType = {
  label: string;
  value: string;
}

export type FormMultiSelectFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  options?: OptionType[];
  loading?: boolean;
  placeholder?: string;
  className?: string;
  minSearchLength?: number;
  inputValue?: string;
  onInputValueChange?: (value: string) => void;
};


/**
 * FormMultiSelectField exposes a reusable multi-select input backed by MUI Autocomplete and
 * wired into react-hook-form via Controller. The component supports controlled and uncontrolled
 * input text, debounced fetching, and loading indicators.
 *
 * @param props.control react-hook-form control instance that manages the field state.
 * @param props.name form field path where the selected string array is stored.
 * @param props.label text label passed to the underlying text field.
 * @param props.options array of selectable strings rendered inside the dropdown (defaults to []).
 * @param props.loading shows a spinner next to the input when true.
 * @param props.placeholder placeholder text displayed when no chips are selected.
 * @param props.className optional CSS class applied to the Autocomplete root.
 * @param props.minSearchLength minimum characters required before options are shown (default 0).
 * @param props.inputValue controlled input string; falls back to internal state if undefined.
 * @param props.onInputValueChange callback fired whenever the user types in the autocomplete input.
 */
export const FormMultiSelectField = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  options = [],
  loading = false,
  placeholder,
  className,
  minSearchLength = 0,
  inputValue: inputValueProp,
  onInputValueChange,
}: FormMultiSelectFieldProps<TFieldValues>) => {
  const [internalInputValue, setInternalInputValue] = useState('');
  const resolvedInputValue = inputValueProp ?? internalInputValue;
  // Determine if the current input value meets the minimum search length
  const meetsThreshold = resolvedInputValue.length >= minSearchLength;
  const displayedOptions = useMemo(() => (meetsThreshold ? options : []), [meetsThreshold, options]);
  const noOptionsText = useMemo(() => {
    if (!meetsThreshold && minSearchLength > 0) {
      return `Type at least ${minSearchLength} characters`;
    }
    return 'No options';
  }, [meetsThreshold, minSearchLength]);

  const handleInputChange = (_: unknown, value: string) => {
    if (onInputValueChange) {
      onInputValueChange(value);
    } else {
      setInternalInputValue(value);
    }
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Autocomplete
          multiple
          options={displayedOptions}
          value={field.value ?? []}
          onChange={(_, value) => field.onChange(value)}
          filterSelectedOptions
          loading={loading}
          className={className}
          inputValue={resolvedInputValue}
          onInputChange={handleInputChange}
          noOptionsText={noOptionsText}
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
};
