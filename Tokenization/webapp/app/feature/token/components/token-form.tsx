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
import { useEffect } from 'react';

import { FormInputNumber } from '~/shared/components/form/form-input';
import { FormSelectMulti, FormSelect } from '~/shared/components/form/form-select';
import { SelectGroup } from '~/shared/components/form/select-group';
import { ResetButton, SubmitButton } from '~/shared/components/form/form-buttons';
import { useTokenForm } from '~/feature/token/hooks/token-form';
import { Form } from '~/shared/components/form/form';
import Modal from '~/shared/components/window/modal';
import { WindowTitle, 
  WindowContent, 
  WindowButtonAccept, 
  WindowButtonCancel, 
  WindowCloseIcon } from '~/shared/components/window/window-objects';
import Alert from '~/shared/components/window/alert';
import { useAuth } from '~/feature/auth/hooks/session';

const httpMethodOptions = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
];

/**
 * Not reusable Token Form component
 */
export function TokenForm() {
  const { state, actions } = useTokenForm();
  const { fetcher, ref } = state;

  return (
    <Form submitRef={ref} fetcher={fetcher} action="/tokens/new">
      <FormInputNumber
        name="expiration-time"
        labelText="Expiration Time (hours):"
        value={state.expirationTime}
        setValue={actions.setExpirationTime}
      />
      <FormSelectMulti
        id="http-select-methods"
        options={httpMethodOptions}
        value={state.selectedMethods}
        setValue={actions.setSelectedMethods}
        placeholder="Choose HTTP Methods..."
        label="HTTP Methods"
      />
      {state.loaderData && (
        <>
          <SelectGroup>
            <FormSelect
              id="first-service-select"
              options={state.loaderData}
              value={state.firstSelectedService}
              setValue={actions.setFirstSelectedService}
              placeholder="Select First Service..."
              label="First Service"
            />
            <FormSelect
              id="second-service-select"
              options={state.loaderData}
              value={state.secondSelectedService}
              setValue={actions.setSecondSelectedService}
              placeholder="Select Second Service..."
              label="Second Service"
            />
          </SelectGroup>
          <div className="mv3 flex-row g1 align-center">
            <SubmitButton action={actions.onSubmit} />
            <ResetButton action={actions.onReset} />
          </div>
        </>
      )}
    </Form>
  );
}

/**
 * Not reusable Windows prepared for Token Form component
 */
export function TokenFormWindows() {
  const { state, actions } = useTokenForm();
  const { fetcher } = state;
  const { submit } = actions;

  const auth = useAuth('admin');
  const { setAlert, setOpenAlert, setOpenModal } = actions;

  const callApi = () => {
    if (auth) {
      submit();
    } else {
      setAlert({ key: Date.now(),
        title: 'Authorization error',
        message: 'You cannot perform this action without authorization.',
        success: false });
      setOpenAlert(true);
    }
    setOpenModal(false);
  };

  useEffect(() => {
    if (fetcher.state === 'idle' && (fetcher.data as any)?.success === true) {
      setAlert({ key: Date.now(),
        title: 'Token created',
        message: 'Token has been created successfully.',
        success: true });
      setOpenAlert(true);
    } else if (fetcher.state === 'idle' && (fetcher.data as any)?.success === false) {
      setAlert({ key: Date.now(),
        title: 'Token creation failed',
        message: 'An error occurred while creating the token.',
        success: false });
      setOpenAlert(true);
    }
  }, [fetcher, fetcher.state, setAlert, setOpenAlert]);

  return (
    <>
      <Modal open={state.openModal} setOpen={actions.setOpenModal} className="bg-primary">
        <WindowTitle>Confirm Token Creation</WindowTitle>
        <WindowContent>
          <div className="flex-column align-center justify-center">
            <div className="mb2">Are you sure you want to create the token with the specified settings?</div>
            <div>Service from: {state.firstLabel}</div>
            <div>Service to: {state.secondLabel}</div>
            <div>Expiration time: {state.expirationTime} hours</div>
            <div>HTTP methods: {state.selectedMethods.join(', ')}</div>
          </div>
        </WindowContent>
        <WindowButtonAccept className="btn-success" action={callApi} />
        <WindowButtonCancel />
      </Modal>
      <Alert
        key={state.alert?.key}
        open={state.openAlert}
        setOpen={actions.setOpenAlert}
        timeout={6000}
        className={state.alert?.success ? 'bg-success' : 'bg-danger'}
      >
        <WindowTitle>{state.alert?.title}</WindowTitle>
        <WindowContent>{state.alert?.message}</WindowContent>
        <WindowCloseIcon />
      </Alert>
    </>
  );
}
