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
import type { OptionType } from '~/utils/types';
import { type SelectInterface } from './form.d';
import { FormSelectBase, SelectFrame, SelectFrameMulti } from './select-helper';

/**
 * FormSelect
 *
 * Single-select wrapper that maps value/setValue to selected option and selection handler.
 *
 * @template T
 * @param {object} props - component props
 * @param {string} props.id - unique id (from SelectInterface)
 * @param {import('~/utils/types').OptionType[]} props.options - array of options to choose from
 * @param {T} props.value - currently selected raw value (string|number)
 * @param {React.Dispatch<import('react').SetStateAction<T>>} props.setValue - setter to update the raw value when selection changes
 * @param {string} [props.placeholder] - placeholder text
 * @param {string|null} [props.label] - optional label shown above select
 *
 * Behaviour:
 * - Finds the Option matching `value` and passes that to FormSelectBase as `selected`.
 * - Provides handleSelect(val: T) that updates `setValue(val)`.
 */
export function FormSelect<T extends string | number = string>(props: SelectInterface<T>) {
  const { value, setValue, options } = { ...props };
  const selected = options.find((o) => o.value === value) ?? null;
  const handleSelect = (val: T) => {
    setValue(val);
  };

  return (
    <FormSelectBase
      {...props}
      selected={selected}
      handleSelect={handleSelect as (value: T extends Array<infer U> ? U : T) => void}
      render={SelectFrame}
    />
  );
}

/**
 * FormSelectMulti
 *
 * Multi-select wrapper that expects value to be an array and provides select/deselect handlers.
 *
 * @template T
 * @param {object} props - component props
 * @param {string} props.id - unique id (from SelectInterface)
 * @param {import('~/utils/types').OptionType[]} props.options - array of available options
 * @param {T[]} props.value - array of selected raw values
 * @param {React.Dispatch<import('react').SetStateAction<T[]>>} props.setValue - setter to update the array of selected values
 * @param {string} [props.placeholder] - placeholder text
 * @param {string|null} [props.label] - optional label shown above select
 *
 * Behaviour:
 * - Computes `selected` as list of Option entries whose value is included in `value`.
 * - handleSelect adds an item to the value array; handleDeselect removes it.
 */
export function FormSelectMulti<T extends string | number = string>(props: SelectInterface<T[]>) {
  const { value, setValue, options } = { ...props };
  // Now elements in `selected` follow the order of adding
  const selected = (value as T[]).map(v => options.find(o => o.value === v)).filter(Boolean) || [];

  const handleSelect = (val: T) => {
    setValue((prev) => [...prev, val]);
  };

  const handleDeselect = (val: T) => {
    setValue((prev) => prev.filter(v => v !== val));
  };

  return (
    <FormSelectBase
      {...props}
      selected={selected as OptionType[]}
      handleSelect={handleSelect}
      handleDeselect={handleDeselect}
      takeSelectedToOption={false}
      render={SelectFrameMulti}
    />
  );
}

/**
 * FormSelectMultiOrdering
 *
 * Multi-select wrapper that filters out options that are already selected in opposite order.
 *
 * @template T
 * @param {object} props - component props
 * @param {string} props.id - unique id (from SelectInterface)
 * @param {import('~/utils/types').OptionType[]} props.options - array of available options
 * @param {T[]} props.value - array of selected raw values
 * @param {React.Dispatch<import('react').SetStateAction<T[]>>} props.setValue - setter to update the array of selected values
 * @param {string} [props.placeholder] - placeholder text
 * @param {string|null} [props.label] - optional label shown above select
 *
 * Behaviour:
 * - Computes `selected` as list of Option entries whose value is included in `value`.
 * - handleSelect adds an item to the value array; handleDeselect removes it.
 * - Filters out options that are already selected in opposite order (e.g., if 'id' is selected, '-id' is removed from options).
 */
export function FormSelectMultiOrdering<T extends string | number = string>(props: SelectInterface<T[]>) {
  const { value, setValue, options } = { ...props };
  let optionsFiltered = options;

  // Typescipt safety check
  if (Array.isArray(value)) {
    for (const val of value) {
      const valStr = String(val);
      // There is django ordering convention where negative value means opposite order
      if (valStr.startsWith('-')) {
        const actualVal = valStr.substring(1);
        optionsFiltered = optionsFiltered.filter(opt => String(opt.value) !== actualVal);
      } else {
        optionsFiltered = optionsFiltered.filter(opt => String(opt.value) !== `-${  valStr}`);
      }
    }
  }

  return (
    <FormSelectMulti
      {...props}
      value={value}
      setValue={setValue}
      options={optionsFiltered}
    />
  );
}
