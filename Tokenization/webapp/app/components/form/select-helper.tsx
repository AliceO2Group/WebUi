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

import React, { useEffect, useRef, useState } from 'react';
import { type OptionType as Option } from '~/utils/types';
import { type SelectLabelProps, type SelectOptionsProps, type SelectInterface } from './form.d';
import { SelectedList } from './multi-select-helper';

export const SelectFrame = <T extends string | number>(props: SelectLabelProps<T>) => {
  const { open, setOpen, selected, placeholder } = props;
  const _selected: Option | null = Array.isArray(selected) ? (selected.length > 0 ? selected[0] : null) : selected;

  return (<div
    onClick={() => setOpen((prev) => !prev)}
    className="flex-row border p2 justify-between br2 bg-white bra2"
  >
    <span>
      {_selected ? _selected.label : <span>{placeholder}</span>}
    </span>
    <span>{open ? '▴' : '▾'}</span>
  </div>
  );
};

export const SelectFrameMulti = <T extends string | number>(props: SelectLabelProps<T>) => {
  const { open, setOpen, selected, placeholder, handleDeselect } = props;
  const _selected: Option[] | null = Array.isArray(selected) ? selected : (selected ? [selected] : null);

  return (<div
    onClick={() => setOpen((prev) => !prev)}
    className="flex-row border p2 justify-between br2 bg-white bra2"
  >
    <span>
      {_selected &&
            _selected.length > 0 ?
        <SelectedList selected={_selected} handleDeselect={handleDeselect} /> :
        <span>{placeholder}</span>
      }
    </span>
    <span>{open ? '▴' : '▾'}</span>
  </div>
  );

};

export const SelectOptions = <T extends string | number, >({ takeSelectedToOption = true, ...rest }: SelectOptionsProps<T>) => {
  const { open, setOpen, handleSelect, options, selected } = rest;
  const _selected = Array.isArray(selected) ? selected : [selected];
  const visibleOptions = takeSelectedToOption ? options : options.filter((opt) => !(_selected.includes(opt)));

  const _handleSelect = (val: T) => {
    handleSelect?.(val);
    setOpen(false);
  };

  return (
    <>
      {open && (
        <ul className="absolute w-100 bg-white br2 bra2 p0 level1 mv1">
          {visibleOptions.length > 0 ? (
            visibleOptions.map((opt) => (
              <li
                key={String(opt.value)}
                onClick={() => _handleSelect(opt.value as T)}
                className="f4 menu-item m0"
              >
                {opt.label}
              </li>
            ))
          ) : (
            <li className="f4 menu-item-static m0">No options available</li>
          )}
        </ul>
      )}
    </>
  );
};

export const FormSelectBase = <T extends string | number | (string | number)[] = string, V = T extends Array<infer U> ? U : T>({
  id,
  options = [],
  placeholder = 'Choose an option',
  label,
  selected,
  handleSelect,
  handleDeselect,
  takeSelectedToOption,
  render,
}: SelectInterface<T, V>) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const onClickExpand = () => {
    setOpen((prev) => !prev);
  };

  const selectFrame = render ?
    React.createElement(render, { open, setOpen, selected, placeholder, handleDeselect, takeSelectedToOption })
    : null;

  return (
    <div ref={rootRef} id={id} className="relative">
      {label && <span onClick={onClickExpand}>{label}</span>}
      {selectFrame}
      <SelectOptions
        open={open}
        setOpen={setOpen}
        options={options}
        handleSelect={handleSelect as (value: T extends Array<infer U> ? U : T) => void}
        selected={selected}
        takeSelectedToOption={takeSelectedToOption}
      />
    </div>
  );
};
