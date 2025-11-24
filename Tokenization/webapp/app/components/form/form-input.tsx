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
import { type FormInputInterface } from './form.d';

/**
 * FormInput
 *
 * Generic input wrapper that normalizes change handling for string and number values.
 *
 * @template T - input value type, either string or number (default: string).
 * @param {object} props - Component props.
 * @param {T} props.value - Current input value.
 * @param {(v: T) => void} props.setValue - Setter for the value; called with parsed value on change.
 * @param {string} [props.labelText] - Optional label text displayed above the input.
 * @param {React.HTMLAttributes<HTMLDivElement>} [props.containerProps] - Props spread onto the outer container element.
 * @param {React.LabelHTMLAttributes<HTMLLabelElement>} [props.labelProps] - Props spread onto the label element.
 * @param {React.InputHTMLAttributes<HTMLInputElement>} [props.inputProps] - Props spread onto the input element.
 *
*/
export function FormInput<T extends string | number = string>({
  value,
  setValue,
  labelText,
  containerProps,
  labelProps,
  inputProps,
}: FormInputInterface<T>) {
  const inputId = inputProps?.id ?? labelProps?.htmlFor ?? undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    let newVal: T;
    if (typeof value === 'number') {
      const parsed = parseFloat(target.value);
      newVal = (isNaN(parsed) ? 0 : parsed) as T;
    } else {
      newVal = target.value as T;
    }
    setValue(newVal);
  };

  return (
    <div className='my-input' {...containerProps}>
      {labelText && (
        <label {...labelProps} htmlFor={inputId}>
          {labelText}
        </label>
      )}
      <input
        {...inputProps}
        id={inputId}
        value={value as unknown as string}
        onChange={handleChange}
      />
    </div>
  );
}
