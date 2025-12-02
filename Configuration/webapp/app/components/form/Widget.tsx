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

import { type FC, type PropsWithChildren, type ReactElement } from 'react';
import FormControlLabel from '@mui/material/FormControlLabel';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import { type Control } from 'react-hook-form';
import type { InputsType } from '~/routes/configuration';
import { FormTextInput } from './widgets/FormTextInput';

export interface WidgetProps extends PropsWithChildren {
  sectionTitle: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  value: unknown;
  control: Control<InputsType>;
}

export const Widget: FC<WidgetProps> = ({ type, ...rest }): ReactElement => {
  switch (type) {
    case 'string':
      return <FormTextInput {...rest} />;
    case 'number':
      return <TextField type="number" defaultValue={rest.value} label={rest.label} />;
    case 'boolean':
      return (
        <FormControlLabel
          control={<Switch defaultChecked={rest.value === 'true'} />}
          label={rest.label}
        />
      );
    case 'array':
      return <>array not implemented</>; // TODO OGUI-1803: add implementation after the decision is made
  }
};
