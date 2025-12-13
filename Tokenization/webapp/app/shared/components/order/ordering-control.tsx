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

import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material/Select';

export type OrderingRule = {
  field: string;
  direction: 'asc' | 'desc';
};

export type OrderingOption = {
  value: string;
  label: string;
};

export type OrderingControlProps = {
  label?: string;
  value?: OrderingRule[];
  onChange: (rules: OrderingRule[]) => void;
  options: OrderingOption[];
};

const directionLabels: Record<'asc' | 'desc', string> = {
  asc: 'Ascending',
  desc: 'Descending',
};

const directions: Array<'asc' | 'desc'> = ['asc', 'desc'];

type DirectionalOption = {
  key: string;
  field: string;
  direction: 'asc' | 'desc';
  label: string;
};

// Duplicate every user-facing option into asc/desc variants with stable keys.
const buildDirectionalOptions = (options: OrderingOption[]): DirectionalOption[] =>
  options.flatMap((option) =>
    directions.map((direction) => ({
      key: `${option.value}:${direction}`,
      field: option.value,
      direction,
      label: `${option.label} (${directionLabels[direction]})`,
    })),
  );

/**
 * Ordering Control component allowing users to select multiple ordering rules
 * from a predefined set of fields and directions. 
 * 
 * The elements are rendered using MUI Select with ChipStack as the display for selected items.
 * 
 * Component won't let to have two ordering rules for the same field;
 * 
 * @param props.label - Label for the ordering control.
 * @param props.value - Currently selected ordering rules.
 * @param props.onChange - Callback invoked when the ordering rules change.
 * @param props.options - Available ordering options.
 * 
 */
export function OrderingControl({ label = 'Ordering', value = [], onChange, options }: OrderingControlProps) {
  // Derive multi-select keys for the currently applied rules.
  const selectedKeys = value.map((rule) => `${rule.field}:${rule.direction}`);
  const directionalOptions = buildDirectionalOptions(options);
  // Fast lookup for labels/directions when rendering chips and menu entries.
  const optionMap = Object.fromEntries(directionalOptions.map((item) => [item.key, item]));

  const handleSelectionChange = (event: SelectChangeEvent<typeof selectedKeys>) => {
    const rawValue = event.target.value;
    const nextKeys = typeof rawValue === 'string' ? rawValue.split(',') : rawValue;
    // Work backwards to keep the last chosen direction per field.
    const dedupedReverse: OrderingRule[] = [];
    const seen = new Set<string>();
    for (let index = nextKeys.length - 1; index >= 0; index -= 1) {
      const key = nextKeys[index];
      const option = optionMap[key];
      // if option field seen before, skip to keep the last chosen direction only
      if (!option || seen.has(option.field)) {
        continue;
      }
      seen.add(option.field);
      dedupedReverse.push({ field: option.field, direction: option.direction });
    }

    // Restore chronological order 
    onChange(dedupedReverse.reverse());
  };

  const handleRemove = (key: string) => {
    onChange(value.filter((rule) => `${rule.field}:${rule.direction}` !== key));
  };

  return (
    <OrderingRoot>
      <FormControl size="small" fullWidth>
        <InputLabel id="ordering-multiselect-label">{label}</InputLabel>
        <Select
          labelId="ordering-multiselect-label"
          label={label}
          multiple
          value={selectedKeys}
          onChange={handleSelectionChange}
          renderValue={(selected) => {
            const keys = selected as string[];
            if (keys.length === 0) {
              return <PlaceholderText>No ordering applied</PlaceholderText>;
            }

            return (
              <ChipStack>
                {keys.map((key) => {
                  const option = optionMap[key];
                  if (!option) {
                    return null;
                  }
                  return (
                    <Chip
                      key={key}
                      label={option.label}
                      size="small"
                      onMouseDown={(event) => event.stopPropagation()}
                      onDelete={() => handleRemove(key)}
                    />
                  );
                })}
              </ChipStack>
            );
          }}
        >
          {directionalOptions.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              <Checkbox checked={selectedKeys.indexOf(option.key) > -1} size="small" />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

    </OrderingRoot>
  );
}

const OrderingRoot = styled(Stack)(({ theme }) => ({
  width: '100%',
  gap: theme.spacing(1),
}));

const ChipStack = styled('div')(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
}));

const PlaceholderText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.disabled,
  fontSize: theme.typography.body2.fontSize,
}));
