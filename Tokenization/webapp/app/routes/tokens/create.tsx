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

import { useState, useEffect } from 'react';

import type { OptionType, HttpMethod } from '~/utils/types';
import { Form } from '~/components/form/form';
import { Box1_1 } from '~/components/box';
import { FormInput } from '~/components/form/form-input';
import { FormSelect, FormSelectMulti } from '~/components/form/form-select';
import { SelectGroup } from '~/components/form/select-group';
import { ResetButton, SubmitButton } from '~/components/form/form-buttons';
import { useAuth } from '~/hooks/session';
import Alert from '~/components/window/alert';
import { WindowButtonAccept, WindowButtonCancel, WindowCloseIcon, WindowContent, WindowTitle } from '~/components/window/window-objects';
import Modal from '~/components/window/modal';

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
 * Component is used for /tokens/new route to create new tokens.
 */
export default function CreateToken({ loaderData }: { loaderData?: OptionType[] }) {
  const [expirationTime, setExpirationTime] = useState<string>('');
  const [firstSelectedService, setFirstSelectedService] = useState<string>('');
  const [secondSelectedService, setSecondSelectedService] = useState<string>('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);

  const [firstSelectedLabel, setFirstSelectedLabel] = useState<string>('');
  const [secondSelectedLabel, setSecondSelectedLabel] = useState<string>('');

  useEffect(() => {
    if (loaderData) {
      const firstLabel = loaderData.find(option => option.value === firstSelectedService)?.label ?? '';
      const secondLabel = loaderData.find(option => option.value === secondSelectedService)?.label ?? '';
      setFirstSelectedLabel(firstLabel);
      setSecondSelectedLabel(secondLabel);
    }
  }, [firstSelectedService, secondSelectedService, loaderData]);

  const auth = useAuth('admin');
  const [openAlert, setOpenAlert] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const [title, setTitle] = useState<string>('Token created');
  const [msg, setMsg] = useState<string>('Token has been created successfully.');
  const [success, setSuccess] = useState<boolean>(false);

  const onSubmit = () => {
    if (expirationTime && firstSelectedService && secondSelectedService && selectedMethods.length > 0) {
      setOpenModal(true);
    } else {
      let message = 'Please fill in all required fields: ';
      if (!firstSelectedService) {
        message += 'First service, ';
      }
      if (!secondSelectedService) {
        message += 'Second service, ';
      }
      if (!expirationTime) {
        message += 'Expiration time, ';
      }
      if (selectedMethods.length == 0) {
        message += 'HTTP methods, ';
      }
      message = message.slice(0, -2);
      setTitle('Form incomplete');
      setMsg(message);
      setSuccess(false);
      setOpenAlert(true);
    }
  };

  const onReset = () => {
    setExpirationTime('');
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
  };

  const callApi = () => {
    if (auth) {
      // eslint-disable-next-line no-console
      console.log('Creating token');
      setTitle('Token created');
      setMsg('Token has been created successfully.');
      setSuccess(true);
    } else {
      setTitle('Authorization error');
      setMsg('You do not have permission to perform this operation.');
      setSuccess(false);
    }
    setOpenAlert(true);
  };

  return ( <>
    <Box1_1 link={null}>
      <div className=''>
        <Form>
          <FormInput
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
    </Box1_1>
    <Alert
      open={openAlert}
      setOpen={setOpenAlert}
      timeout={6000}
      className={success ? 'bg-success' : 'bg-danger'}
    >
      <WindowTitle>{title}</WindowTitle>
      <WindowContent>{msg}</WindowContent>
      <WindowCloseIcon />
    </Alert>
    <Modal
      open={openModal}
      setOpen={setOpenModal}
      className='bg-primary '
    >
      <WindowTitle>Confirm Token Creation</WindowTitle>
      <WindowContent>
        <div className='flex-column align-center justify-center'>
          <div className='mb2'>Are you sure you want to create the token with the specified settings?</div>
          <div>Service from: {firstSelectedLabel}</div>
          <div>Service to: {secondSelectedLabel}</div>
          <div>Expiration time: {expirationTime} hours</div>
          <div>HTTP methods: {selectedMethods.join(', ')}</div>
        </div>
      </WindowContent>
      <WindowButtonAccept className='btn-success' action={callApi}/>
      <WindowButtonCancel/>
    </Modal>
  </>
  );
}
