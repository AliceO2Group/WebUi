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

import type { HttpMethod, OptionType } from '~/utils/types';
import type { AlertType } from '~/shared/components/window/alert';
import { FormInputNumber } from '~/shared/components/form/form-input';
import { ResetButton, SubmitButton } from '~/shared/components/form/form-buttons';
import { Form } from '~/shared/components/form/form';
import { useAuth } from '~/feature/auth/hooks/session';
import useTokenActions from '../../hooks/api/useTokenActions';
import ServiceSelectGroup from './ServiceSelectGroup';
import MethodsSelect from './MethodsSelect';
import TokenFormWindows from './TokenFormWindows';

/**
 * Token Form component
 */
export function TokenForm({ serviceOptions }: { serviceOptions?: OptionType[] }) {
  const [firstSelectedService, setFirstSelectedService] = useState('');
  const [secondSelectedService, setSecondSelectedService] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);
  const [expirationTime, setExpirationTime] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alert, setAlert] = useState<AlertType | null>(null);

  const { create } = useTokenActions();
  const auth = useAuth('admin');

  const resetForm = () => {
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
    setExpirationTime('');
  };

  const handleSubmit = () => {
    if (expirationTime && firstSelectedService && secondSelectedService && selectedMethods.length > 0) {
      setOpenModal(true);
      return;
    }

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
    if (selectedMethods.length === 0) {
      message += 'HTTP methods, ';
    }
    message = message.slice(0, -2);
    setAlert({ title: 'Form incomplete', message, success: false });
    setOpenAlert(true);
  };

  const handleReset = () => {
    resetForm();
  };

  const handleConfirm = () => {
    if (!auth) {
      setAlert({
        title: 'Authorization error',
        message: 'You cannot perform this action without authorization.',
        success: false,
      });
      setOpenAlert(true);
      setOpenModal(false);
      return;
    }

    setOpenModal(false);
    const payload = {
      fromService: firstSelectedService,
      toService: secondSelectedService,
      methods: selectedMethods,
      expirationTime,
    };
    console.log('[TokenForm] Sending create token request', payload);
    create.mutate(payload, {
      onSuccess: (data) => {
        console.log('[TokenForm] Token created successfully', data);
        setAlert({
          title: 'Token created',
          message: 'Token has been created successfully.',
          success: true,
        });
        setOpenAlert(true);
        resetForm();
      },
      onError: (error) => {
        console.error('[TokenForm] Token creation failed', error);
        setAlert({
          title: 'Token creation failed',
          message: error?.message ?? 'An error occurred while creating the token.',
          success: false,
        });
        setOpenAlert(true);
      },
    });
  };

  return (
    <>
      <Form onSubmit={(event) => event.preventDefault()}>
        <FormInputNumber
          name="expiration-time"
          labelText="Expiration Time (hours):"
          value={expirationTime}
          setValue={setExpirationTime}
        />
        <MethodsSelect value={selectedMethods} setValue={setSelectedMethods} />
        {serviceOptions && (
          <>
            <ServiceSelectGroup
              serviceOptions={serviceOptions}
              firstValue={firstSelectedService}
              secondValue={secondSelectedService}
              onFirstChange={setFirstSelectedService}
              onSecondChange={setSecondSelectedService}
            />
            <div className="mv3 flex-row g1 align-center">
              <SubmitButton action={handleSubmit} />
              <ResetButton action={handleReset} />
            </div>
          </>
        )}
      </Form>
      <TokenFormWindows
        serviceOptions={serviceOptions}
        firstSelectedService={firstSelectedService}
        secondSelectedService={secondSelectedService}
        selectedMethods={selectedMethods}
        expirationTime={expirationTime}
        openModal={openModal}
        setOpenModal={setOpenModal}
        alert={alert}
        openAlert={openAlert}
        setOpenAlert={setOpenAlert}
        onConfirm={handleConfirm}
      />
    </>
  );
}
