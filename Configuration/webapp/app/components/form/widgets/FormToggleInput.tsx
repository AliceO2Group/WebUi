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

import { FormControlLabel, styled, Switch, switchClasses } from '@mui/material';
import { Controller } from 'react-hook-form';
import type { ReactElement } from 'react';
import type { WidgetProps } from '../components/Widget';

interface FormToggleInputProps extends Omit<WidgetProps, 'type' | 'value'> {
  isDirty: boolean;
}

const StyledSwitch = styled(Switch)<{ isDirty: boolean }>(
  ({ isDirty, theme }) => `
    & .${switchClasses.switchBase} {
        ${isDirty ? `color: ${theme.palette.secondary.main}` : ''}
    }
    & .${switchClasses.track} {
        ${isDirty ? `background-color: ${theme.palette.secondary.main}` : ''}
    }
`,
);

export const FormToggleInput = ({
  sectionPrefix,
  label,
  control,
  isDirty,
}: FormToggleInputProps): ReactElement => (
  <Controller
    name={sectionPrefix}
    control={control}
    render={({ field }) => (
      <FormControlLabel
        control={
          <StyledSwitch
            {...field}
            checked={Boolean(field.value)}
            onChange={field.onChange}
            isDirty={isDirty}
          />
        }
        label={label}
      />
    )}
  />
);
