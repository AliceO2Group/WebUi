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

import { type OptionType as Option } from '~/utils/types';
import { type SelectInterface } from './form.d';
import { IconContainer, IconX } from '~/ui/icon';

interface SelectedOptionListProps {
  handleDeselect: SelectInterface['handleDeselect'];
  value?: SelectInterface['value'];
  selected?: SelectInterface['selected'];
  label?: SelectInterface['label'];
}

/**
 * SelectedOption
 *
 * List item representing a selected option with a remove button - used to deselect the option.
 *
 * @param {object} props - component props
 * @param {(string|number)|undefined} props.value - option value (string|number)
 * @param {string|undefined} props.label - option label displayed
 * @param {(function(string|number):void)|undefined} props.handleDeselect - optional callback invoked with the option value when remove clicked
 *
 * Notes:
 * - The internal button stopPropagation() so clicks on the remove icon don't toggle the dropdown.
 */
function SelectedOption({ value, label, handleDeselect }: SelectedOptionListProps) {
  const _handleDeselect = (e: React.MouseEvent<HTMLButtonElement>, value: SelectInterface['value']) => {
    handleDeselect?.(value as string | number);
    e.stopPropagation();
  };

  return (
    <li>
      {label}
      <button onClick={(e) => value ? _handleDeselect(e, value) : undefined}>
        <IconContainer>
          <IconX />
        </IconContainer>
      </button>
    </li>
  );
}

/**
 * SelectedList
 *
 * Renders list of currently selected options with remove buttons.
 *
 * @param {object} props - component props
 * @param {import('~/utils/types').OptionType[]|undefined} props.selected - selected options (expected Option[])
 * @param {(function(string|number):void)|undefined} props.handleDeselect - optional deselect callback
 *
 * Notes:
 * - `selected` is treated as Option[] for rendering; the component expects Option objects from ~/utils/types.
 */
export function SelectedList({ selected, handleDeselect }: SelectedOptionListProps) {
  return (
    <ul className='flex-row wrap multiselect-list'>
      {
        (selected as Option[])
          .map((s: Option) =>
            <SelectedOption
              key={s.value}
              value={s.value}
              label={s.label}
              handleDeselect={handleDeselect}
            />,
          )
      }
    </ul>
  );
}
