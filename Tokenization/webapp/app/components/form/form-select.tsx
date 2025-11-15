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
import { type SelectInterface } from './form.d';
import { FormSelectBase, SelectFrame, SelectFrameMulti } from './select-helper';

export const FormSelect = <T extends string | number = string, >(props: SelectInterface<T>) => {
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
};

export const FormSelectMulti = <T extends string | number = string, >(props: SelectInterface<T[]>)=> {
  const { value, setValue, options } = { ...props };
  const selected = options.filter((o) => value.includes(o.value as unknown as T)) || [];


  const handleSelect = (val: T) => {
    setValue((prev) => [...prev, val]);
  };

  const handleDeselect = (val: T) => {
    setValue((prev) => prev.filter(v => v !== val));
  };

  return (
    <FormSelectBase
      {...props}
      selected={selected}
      handleSelect={handleSelect}
      handleDeselect={handleDeselect}
      takeSelectedToOption={false}
      render={SelectFrameMulti}
    />
  );
};
