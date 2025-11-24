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

/**
 * SelectFrame
 *
 * Renders the collapsed select frame for single-select mode.
 *
 * @template T
 * @param {object} props - component props
 * @param {boolean} props.open - whether the dropdown is open
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - setter (useState dispatcher) to toggle open state
 * @param {import('~/utils/types').OptionType | import('~/utils/types').OptionType[] | null} props.selected -
 * currently selected option (Option) or null / array for multi
 * @param {string} props.placeholder - placeholder text shown when nothing selected
 * @param {(value: T) => void} [props.handleDeselect] - optional deselect handler (not used in single-frame but available from the shared type)
 *
 * Notes:
 * - Props come from SelectLabelProps<T>.
 */
export function SelectFrame<T extends string | number>(
  props: SelectLabelProps<T> & { setOpen: React.Dispatch<React.SetStateAction<boolean>> },
) {
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
}

/**
 * SelectFrameMulti
 *
 * Renders the collapsed select frame for multi-select mode (shows selected list).
 *
 * @template T
 * @param {object} props - component props
 * @param {boolean} props.open - whether the dropdown is open
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - setter (useState dispatcher) to toggle open state
 * @param {import('~/utils/types').OptionType | import('~/utils/types').OptionType[] | null} props.selected - selected option(s)
 * @param {string} props.placeholder - placeholder text shown when no selection
 * @param {(value: T) => void} [props.handleDeselect] - callback invoked when user removes a selected item
 *
 * Notes:
 * - Uses SelectedList when selected is an array. - which should be the case for multi-select.
 */
export function SelectFrameMulti<T extends string | number>(
  props: SelectLabelProps<T> & { setOpen: React.Dispatch<React.SetStateAction<boolean>> },
) {
  const { open, setOpen, selected, placeholder, handleDeselect } = props;
  const _selected: Option[] | null = Array.isArray(selected) ? selected : (selected ? [selected] : null);

  return (<div
    onClick={() => setOpen((prev) => !prev)}
    className="flex-row border p2 justify-between br2 bg-white bra2"
  >
    <span>
      {_selected &&
        _selected.length > 0 ?
        <SelectedList selected={_selected} handleDeselect={handleDeselect as (value: string | number) => void} /> :
        <span>{placeholder}</span>
      }
    </span>
    <span>{open ? '▴' : '▾'}</span>
  </div>
  );
}

/**
 * SelectOptions
 *
 * Renders dropdown list of options and calls handleSelect on click.
 *
 * @template T
 * @param {object} props - component props
 * @param {boolean} props.open - whether the dropdown is open
 * @param {React.Dispatch<React.SetStateAction<boolean>>} props.setOpen - setter (useState dispatcher) to change open state
 * @param {import('~/utils/types').OptionType[]} props.options - available options to render
 * @param {import('~/utils/types').OptionType | import('~/utils/types').OptionType[] | null} [props.selected] - currently selected option(s);
 * used to hide already-selected items when takeSelectedToOption is false
 * @param {boolean} [props.takeSelectedToOption=true] - when false, selected options are removed from the options list
 * @param {(value: T) => void} [props.handleSelect] - callback invoked with the option value when an option is clicked
 *
 * Notes:
 * - Props come from SelectOptionsProps<T>.
 */
export function SelectOptions<T extends string | number>(
  { takeSelectedToOption = true, ...rest }:
    SelectOptionsProps<T> & { setOpen: React.Dispatch<React.SetStateAction<boolean>> },
) {
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
}

/**
 * FormSelectBase
 *
 * Base logic used by single and multi select components (frame + options + outside-click handling).
 *
 * @template T,V
 * @param {object} props - component props
 * @param {string} props.id - unique id for the select root element
 * @param {import('~/utils/types').OptionType[]} props.options - list of options shown in the dropdown
 * @param {string} [props.placeholder] - placeholder text shown when nothing selected
 * @param {string|null} [props.label] - optional label element displayed above the select frame
 * @param {import('~/utils/types').OptionType | import('~/utils/types').OptionType[] | null} [props.selected] -
 * currently selected option(s) passed to the frame renderer
 * @param {(value: V) => void} [props.handleSelect] - callback invoked when an option is selected
 * @param {(value: V) => void} [props.handleDeselect] - callback invoked when an option is deselected (used in multi-select)
 * @param {boolean} [props.takeSelectedToOption] - whether selected items remain visible in the options list
 * @param {React.ElementType} [props.render] -  renderer for the select frame -
 * FormSelect uses SelectFrame, FormSelectMulti uses SelectFrameMulti
 *
 * Notes:
 * - This component handles outside-click closing and delegates frame and options rendering.
 */
export function FormSelectBase<T extends string | number | (string | number)[] = string, V = T extends Array<infer U> ? U : T>({
  id,
  options = [],
  placeholder = 'Choose an option',
  label,
  selected,
  handleSelect,
  handleDeselect,
  takeSelectedToOption,
  render,
}: SelectInterface<T, V>) {
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
}
