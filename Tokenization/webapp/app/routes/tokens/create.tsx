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

import { useState } from 'react';

import type { OptionType, HttpMethod } from '~/utils/types';
import { Form } from '~/components/form/form';
import { Box1_2 } from '~/components/box';
import { FormInput } from '~/components/form/form-input';
import { FormSelect, FormSelectMulti } from '~/components/form/form-select';
import { SelectGroup } from '~/components/form/select-group';
import { ResetButton, SubmitButton } from '~/components/form/form-buttons';
import { useAuth } from '~/hooks/session';
import Alert from '~/components/window/alert';
import { WindowCloseIcon, WindowContent, WindowTitle } from '~/components/window/window-objects';

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

/**
 *
 */
export default function CreateToken({ loaderData }: { loaderData?: OptionType[] }) {
  const [expirationTime, setExpirationTime] = useState<number>(0);
  const [firstSelectedService, setFirstSelectedService] = useState<string>('');
  const [secondSelectedService, setSecondSelectedService] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);

  const auth = useAuth('admin');
  const [openAlert, setOpenAlert] = useState<boolean>(false);

  const [title, setTitle] = useState<string>('Token created');
  const [msg, setMsg] = useState<string>('Token has been created successfully.');

  const onSubmit = () => {
    if(!expirationTime || !firstSelectedService || !secondSelectedService || selectedMethods.length === 0) {
      
    }
    if (auth) {
      // eslint-disable-next-line no-console
      console.log('api call to backend to create token');
    }
    setOpenAlert(true);
  }

  const onReset = () => {
    setExpirationTime(0);
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
  }

  return ( <>
    <Box1_2 link={null}>
      <div className=''>
        <Form>
          <FormInput<number>
            labelText='Expiration Time (hours):'
            value={expirationTime}
            setValue={setExpirationTime}
            inputProps={{ type: 'number', step: 1, min: 0 }}
          />
          {/* <FormInput<string>
            labelText='Expiration Time (date)'
            value={null}
            setValue={null}
            inputProps={{ type: 'datetime-local' }}
          /> */}
          <FormSelectMulti
            id='http-select-methods'
            options={httpMethodOptions}
            value={selectedMethods}
            setValue={setSelectedMethods}
            placeholder='Choose HTTP Methods for Token...'
            label='HTTP Methods'
          />
          {loaderData &&
            <>
            <SelectGroup>
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
              />
            </SelectGroup>
            <div className='mv3 flex-row g1 align-center'>
              <SubmitButton action={onSubmit} />
              <ResetButton action={onReset} />
            </div>
            </>
          }
        </Form>
      </div>
    </Box1_2>
    <Alert
      open={openAlert}
      setOpen={setOpenAlert}
      timeout={6000}
      className='bg-success'
    >
      <WindowTitle>{title}</WindowTitle>
      <WindowContent>{msg}</WindowContent>
      <WindowCloseIcon />
    </Alert>
  </>
  );
}
