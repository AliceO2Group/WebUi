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

import { useNavigate } from 'react-router';
import Select, { type MultiValue, type SingleValue } from 'react-select';
import { useState, useCallback } from 'react';
// import {
//   TextField,
//   InputAdornment,
// } from '@mui/material';

import type { OptionType, HttpMethod } from '~/utils/types';
// import { DangerAlert } from '~/ui/alert';
// import { CreationTokenDialog } from '~/ui/dialog';
// import { useAuth } from '~/hooks/session';
import { Form } from '~/components/form/form';
import { Box1_2 } from '~/components/box';
import { FormInput } from '~/components/form/form-input';
import { FormSelect, FormSelectMulti } from '~/components/form/form-select';

// eslint-disable-next-line jsdoc/require-jsdoc
export function clientLoader(): OptionType[] {
  return [
    { value: 'service1', label: 'Service 1' },
    { value: 'service2', label: 'Service 2' },
    { value: 'service3', label: 'Service 3' },
    { value: 'service4', label: 'Service 4' },
  ];
}

// HTTP Method options
const httpMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];



export default function CreateToken({ loaderData }: { loaderData?: OptionType[] }) {
  const [expirationTime, setExpirationTime] = useState<number>(0);
  const [firstSelectedService, setFirstSelectedService] = useState<string>('');
  const [secondSelectedService, setSecondSelectedService] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);

  return ( <>
    <Box1_2 link={null}>
      <Form>
        <FormInput<number>
          labelText="Expiration Time (hours):" 
          value={expirationTime}
          setValue={setExpirationTime}
          inputProps={{step: 1, min: 0}}
          />
        <FormSelectMulti
          id='http-select-methods'     
          options={httpMethodOptions}
          value={selectedMethods}
          setValue={setSelectedMethods}
          placeholder='Choose HTTP Methods for Token...'
          label='HTTP Methods'
        />
        {loaderData && <>
          <FormSelect
            id="first-service-select"
            options={loaderData}
            value={firstSelectedService}
            setValue={setFirstSelectedService}
            placeholder="Select First Service..."
            label="First Service" 
          />
          <FormSelect
            id="second-service-select"
            options={loaderData}
            value={secondSelectedService}
            setValue={setSecondSelectedService}
            placeholder="Select Second Service..."
            label="Second Service"
          /></>
        }
      </Form>
    </Box1_2>
    </>
  );
}
