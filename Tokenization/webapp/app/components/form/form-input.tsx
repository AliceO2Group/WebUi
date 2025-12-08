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

import React, { type PropsWithChildren } from 'react';
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
function FormInput<T extends string | number = string>({
  value,
  setValue,
  labelText,
  name,
  children,
}: PropsWithChildren<FormInputInterface<T>>) {

  // If setValue and value are provided than input is controlled
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    let newVal: T;
    if (typeof value === 'number') {
      const parsed = parseFloat(target.value);
      newVal = (isNaN(parsed) ? 0 : parsed) as T;
    } else {
      newVal = target.value as T;
    }
    setValue?.(newVal);
  };

  const childInput = React.Children.toArray(children)[0];
  const input = React.cloneElement(childInput as React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>, {
    id: name,
    value: value as unknown as string,
    onChange: handleChange,
  });

  return (
    <div className='my-input'>
      {labelText && (
        <label htmlFor={name}>
          {labelText}
        </label>
      )}
      {input}
    </div>
  );
}

/**
 * FormInputNumber
 *
 * Number input specialization of FormInput.
 *
 * @param {object} props - component props
 * @param {number} props.value - current numeric value
 * @param {(v: number) => void} props.setValue - setter for the numeric value
 * @param {string} [props.labelText] - optional label text
 * @param {string} props.name - input name attribute
 *
 * notes:
 * - step is set to 1 and min to 0 in the input element
 * - if value and setValue are provided than input is controlled
 */
export function FormInputNumber({ value, setValue, labelText, name }: FormInputInterface) {
  return <FormInput
    value={value}
    setValue={setValue}
    labelText={labelText}
    name={name}
  >
    <input type='number' name={name} step={1} min={0}/>
  </FormInput>;
}

export function FormInputDatetime({ value, setValue, labelText, name }: FormInputInterface<string>) {
  return <FormInput
    value={value}
    setValue={setValue}
    labelText={labelText}
    name={name}
  >
    <input type='datetime-local' name={name} />
  </FormInput>;
}