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

import { Controller, type Control } from 'react-hook-form';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import { styled } from '@mui/material/styles';

import type { ServiceRouteCreationFormValues } from './types';

type PermissionsFieldProps = {
  control: Control<ServiceRouteCreationFormValues>;
  options: string[];
  disabled: boolean;
};

/**
 * Binds the permissions selector to the form control with validation.
 */
export function PermissionsField({ control, options, disabled }: PermissionsFieldProps) {
  return (
    <Controller
      control={control}
      name="permissions"
      rules={{ validate: (value) => (value?.length ? true : 'Select at least one permission.') }}
      render={({ field, fieldState }) => (
        <PermissionsSelector
          options={options}
          selected={field.value ?? []}
          onChange={field.onChange}
          disabled={disabled}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

type PermissionsSelectorProps = {
  options: string[];
  selected: string[];
  onChange: (value: string[]) => void;
  disabled: boolean;
  error?: string;
};

/**
 * Renders the checkbox grid used to assign permissions to a route.
 */
export function PermissionsSelector({ options, selected, onChange, disabled, error }: PermissionsSelectorProps) {
  const handleTogglePermission = (permission: string) => {
    if (selected.includes(permission)) {
      onChange(selected.filter((item) => item !== permission));
      return;
    }
    onChange([...selected, permission]);
  };

  return (
    <PermissionsContent>
      <PermissionsOptions>
        {options.map((permission) => (
          <FormControlLabel
            key={permission}
            control={(
              <Checkbox
                size="small"
                checked={selected.includes(permission)}
                onChange={() => handleTogglePermission(permission)}
                disabled={disabled}
              />
            )}
            label={permission}
          />
        ))}
      </PermissionsOptions>
      {error ? <FormHelperText error>{error}</FormHelperText> : null}
    </PermissionsContent>
  );
}

const PermissionsContent = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const PermissionsOptions = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(1),
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
}));
