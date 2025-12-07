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
import { IconDataTransferUpload } from '~/ui/icon';

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

export function FormInputFile({ name }: { name: string }) {
  const style = {
    border: '2px dashed black',
    padding: '1rem',
    cursor: 'pointer',
    width: '60%',
  }

  const divRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const onClick = () => {
    if (divRef.current) {
      inputRef.current?.click();
    }
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if(inputRef.current) {
      const dataTransfer = new DataTransfer();
      for (let i = 0; i < files.length; i++) {
        dataTransfer.items.add(files[i]);
      }
      inputRef.current.files = dataTransfer.files;
    }

    // triggering input change event to notify form about new file
    const changeEvent = new Event('input', { bubbles: true });
    inputRef.current?.dispatchEvent(changeEvent);
  }

  const onInputChange = () => {
    if(inputRef.current) {
      inputRef.current.value = '' // reset file input to allow uploading the same file again
    }
  }

  return <div className="flex-row justify-center"> 
      <div 
      style={style} 
      ref={divRef} 
      onClick={onClick} 
      onDrop={onDrop}
      onDragOver={onDragOver}
      >
      <span className="flex-row justify-center"> Choose file or drag & drop here </span>
      <input type="file" name={name} hidden onChange={onInputChange} ref={inputRef} />
      <div className="flex-row justify-center mv3 f2">
        <IconDataTransferUpload  />
      </div>
    </div>
  </div>
}
