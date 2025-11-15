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

import React, { useEffect, useRef, useState, type SetStateAction, type JSX } from 'react';
import { type OptionType as Option, type DialogPropsBase as DPB } from '~/utils/types';
import { SelectedList } from './multi-select-helper';

interface SelectInterface<T = string | number | (string | number)[]> {
  id: string;
  options: Option[];
  placeholder?: string;
  label: string | null;
  value: T;
  setValue: React.Dispatch<SetStateAction<T>>;
  selected?: Option | Option[] | null;
  handleSelect?: (value: T) => void;
  handleDeselect?: (value: T) => void;
  takeSelectedToOption?: boolean;
  render?: React.ElementType;
}

interface SelectLabelProps<T extends string | number> extends DPB {
  selected: Option | Option[] | null;
  placeholder: string;
  handleDeselect?: (value: T) => void;
}

interface SelectOptionsProps<T extends string | number> extends DPB {
  options: Option[];
  selected?: Option | Option[] | null;
  takeSelectedToOption?: boolean;
  handleSelect?: (value: T) => void;

}

const SelectFrame = <T extends string | number>(props: SelectLabelProps<T>) => {
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

const SelectFrameMulti = <T extends string | number>(props: SelectLabelProps<T>) => {
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

const SelectOptions = <T extends string | number, >({ open, setOpen, handleSelect, options, selected, takeSelectedToOption = true }: SelectOptionsProps<T>) => {
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

const FormSelectBase = <T extends string | number = string, > ({
  id,
  options = [],
  placeholder = 'Choose an option',
  label,
  selected,
  handleSelect,
  handleDeselect,
  takeSelectedToOption,
  render,
}: SelectInterface<T>) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
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
      <SelectOptions<T>
        open={open}
        setOpen={setOpen}
        options={options}
        handleSelect={handleSelect}
        selected={selected}
        takeSelectedToOption={takeSelectedToOption}
      />
    </div>
  );
};

export const FormSelect = <T extends string | number = string, >(props: SelectInterface<T>): JSX.Element => {
  const { value, setValue, options } = { ...props };
  const selected = options.find((o) => o.value === value) ?? null;
  const handleSelect = (val: T) => {
    setValue(val);
  };

  return (
    <FormSelectBase
      {...props}
      selected={selected}
      handleSelect={handleSelect}
      render={SelectFrame}
    />

  );
};

export const FormSelectMulti = <T extends string | number = string,>(props: SelectInterface<T[]>): JSX.Element => {
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
