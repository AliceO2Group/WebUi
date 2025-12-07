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

import type React from 'react';
import { type SetStateAction } from 'react';
import type { OptionType as Option, DialogPropsBase as DPB } from '../../utils/types';

export interface FormInputInterface<T extends string | number = string> {
  value?: T;
  setValue?: React.Dispatch<SetStateAction<T>>;
  labelText?: string;
  name: string;
}

export interface SelectInterface<T = string | number | (string | number)[], V = T extends Array<infer U> ? U : T> {
  id: string;
  options: Option[];
  placeholder?: string;
  label: string | null;
  value: T;
  setValue: React.Dispatch<SetStateAction<T>>;
  selected?: Option | Option[] | null;
  handleSelect?: (value: V) => void;
  handleDeselect?: (value: V) => void;
  takeSelectedToOption?: boolean;
  render?: React.ElementType;
}

export interface SelectLabelProps<T extends string | number> extends DPB {
  selected: Option | Option[] | null;
  placeholder: string;
  handleDeselect?: (value: T) => void;
}

export interface SelectOptionsProps<T extends string | number> extends DPB {
  options: Option[];
  selected?: Option | Option[] | null;
  takeSelectedToOption?: boolean;
  handleSelect?: (value: T) => void;

}
