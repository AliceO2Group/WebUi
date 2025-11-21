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
  value: SelectInterface["value"];
  handleDeselect: SelectInterface["handleDeselect"];
  selected?: SelectInterface["selected"];
  label?: SelectInterface["label"];
}

const SelectedOption = ({ value, label, handleDeselect }: SelectedOptionListProps) => {
  const _handleDeselect = (e: React.MouseEvent<HTMLButtonElement>, value: SelectInterface["value"]) => {
    handleDeselect?.(value);
    e.stopPropagation();
  };

  return (
    <li>
      {label}
      <button onClick={(e) => _handleDeselect(e, value)}>
        <IconContainer>
          <IconX/>
        </IconContainer>
      </button>
    </li>
  );
};



export const SelectedList = ({ selected, handleDeselect }: SelectedOptionListProps) => 
  <ul className='flex-row justify-between multiselect-list'>
    {
      (selected as Option[])
        .map((s: Option) => 
          <SelectedOption 
            key={s.value} 
            value={s.value} 
            label={s.label} 
            handleDeselect={handleDeselect}
            />
      )
    }
  </ul>;
