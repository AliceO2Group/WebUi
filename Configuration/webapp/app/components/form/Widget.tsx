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
import { type FormPrimitiveValue, type PrimitiveRestrictions } from './Form';

export interface WidgetProps extends PropsWithChildren {
  title: string;
  value: FormPrimitiveValue;
  type: PrimitiveRestrictions;
}

export const Widget: FC<WidgetProps> = ({ title, type, value }): ReactElement => {
  switch (type) {
    case 'string':
      return <TextField type="text" defaultValue={value} label={title} />;
    case 'number':
      return <TextField type="number" defaultValue={value} label={title} />;
    case 'boolean':
      return (
        <FormControlLabel control={<Switch defaultChecked={value === 'true'} />} label={title} />
      );
    default:
      return <>unknown widget type: {type}</>;
  }
};
