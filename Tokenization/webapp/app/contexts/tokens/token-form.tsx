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

import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { OptionType, HttpMethod } from '~/utils/types';
import type { AlertType } from '~/components/window/alert';
import { useAuth } from '~/utils/session';

type State = {
  loaderData?: OptionType[];
  expirationTime: string;
  firstSelectedService: string;
  secondSelectedService: string;
  selectedMethods: HttpMethod[];
  firstLabel: string;
  secondLabel: string;
  openAlert: boolean;
  openModal: boolean;
  alert: AlertType | null;
};

type Actions = {
  setExpirationTime: React.Dispatch<React.SetStateAction<string>>;
  setFirstSelectedService: React.Dispatch<React.SetStateAction<string>>;
  setSecondSelectedService: React.Dispatch<React.SetStateAction<string>>;
  setSelectedMethods: React.Dispatch<React.SetStateAction<HttpMethod[]>>;
  onSubmit: () => void;
  onReset: () => void;
  callApi: () => void;
  setOpenAlert: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const TokenFormContext = createContext<{ state: State; actions: Actions } | undefined>(undefined);

/**
 * Form context provider which holds all state and actions for Token Form.
 * It is used to wrap the Token Form and its windows - for them to simplify the props passing.
 * It can be the way for all routes to have their own context providers in the future.
 * As its elegant and not global solution, actions and state can be used corectly only inside
 * components wrapped by this provider.
 *
 * @example <TokenFormProvider loaderData={loaderData}><TokenForm />{}</TokenFormProvider>
 * @usage It is used in webapp/app/hooks/tokens/token-form.tsx - by using useContext(TokenFormContext)
 */
export function TokenFormProvider({ loaderData, children }: { loaderData?: OptionType[]; children: React.ReactNode }) {
  const [expirationTime, setExpirationTime] = useState('');
  const [firstSelectedService, setFirstSelectedService] = useState('');
  const [secondSelectedService, setSecondSelectedService] = useState('');
  const [selectedMethods, setSelectedMethods] = useState<HttpMethod[]>([]);
  const [firstLabel, setFirstLabel] = useState('');
  const [secondLabel, setSecondLabel] = useState('');
  const [openAlert, setOpenAlert] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [alert, setAlert] = useState<AlertType | null>(null);
  const auth = useAuth('admin');

  useEffect(() => {
    if (!loaderData) {
      return;
    }
    const f = loaderData.find(o => o.value === firstSelectedService)?.label ?? '';
    const s = loaderData.find(o => o.value === secondSelectedService)?.label ?? '';
    setFirstLabel(f);
    setSecondLabel(s);
  }, [firstSelectedService, secondSelectedService, loaderData]);

  const onSubmit = useCallback(() => {
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
      if (selectedMethods.length === 0) {
        message += 'HTTP methods, ';
      }
      message = message.slice(0, -2);
      setAlert({ key: Date.now(), title: 'Form incomplete', message, success: false });
      setOpenAlert(true);
    }
  }, [expirationTime, firstSelectedService, secondSelectedService, selectedMethods]);

  const onReset = useCallback(() => {
    setExpirationTime('');
    setFirstSelectedService('');
    setSecondSelectedService('');
    setSelectedMethods([]);
  }, [setExpirationTime, setFirstSelectedService, setSecondSelectedService, setSelectedMethods]);

  const callApi = useCallback(() => {
    if (auth) {
      setAlert({ key: Date.now(),
        title: 'Token created',
        message: 'Token has been created successfully.',
        success: true });
    } else {
      setAlert({ key: Date.now(),
        title: 'Authorization error',
        message: 'You cannot perform this action without authorization.',
        success: false });
    }
    setOpenAlert(true);
    setOpenModal(false);
  }, [auth, setOpenAlert, setAlert, setOpenModal]);

  const state = useMemo(() => ({
    loaderData,
    expirationTime,
    firstSelectedService,
    secondSelectedService,
    selectedMethods,
    firstLabel,
    secondLabel,
    openAlert,
    openModal,
    alert,
  }),
  [loaderData,
    expirationTime,
    firstSelectedService,
    secondSelectedService,
    selectedMethods,
    firstLabel,
    secondLabel,
    openAlert,
    openModal,
    alert,
  ]);

  const actions: Actions = useMemo(() => ({
    setExpirationTime, setFirstSelectedService, setSecondSelectedService, setSelectedMethods,
    onSubmit, onReset, callApi, setOpenAlert, setOpenModal,
  }),
  [setExpirationTime,
    setFirstSelectedService,
    setSecondSelectedService,
    setSelectedMethods,
    setOpenAlert,
    setOpenModal,
    onSubmit,
    onReset,
    callApi,
  ]);

  return <TokenFormContext.Provider value={{ state, actions }}>{children}</TokenFormContext.Provider>;
}
