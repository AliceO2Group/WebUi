import React, { createContext, useEffect, useMemo, useState } from 'react';
import type { OptionType, HttpMethod } from '~/utils/types';
import type { AlertType } from '~/components/window/alert';
import { useAuth } from '~/hooks/session';

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
  const auth = useAuth("admin");

  useEffect(() => {
    if (!loaderData) return;
    const f = loaderData.find(o => o.value === firstSelectedService)?.label ?? '';
    const s = loaderData.find(o => o.value === secondSelectedService)?.label ?? '';
    setFirstLabel(f);
    setSecondLabel(s);
  }, [firstSelectedService, secondSelectedService, loaderData]);

  const onSubmit = () => {
    if (expirationTime && firstSelectedService && secondSelectedService && selectedMethods.length > 0) {
      setOpenModal(true);
    } else {
      let message = 'Please fill in all required fields: ';
      if (!firstSelectedService) message += 'First service, ';
      if (!secondSelectedService) message += 'Second service, ';
      if (!expirationTime) message += 'Expiration time, ';
      if (selectedMethods.length === 0) message += 'HTTP methods, ';
      message = message.slice(0, -2);
      setAlert({ key: Date.now(), title: 'Form incomplete', message, success: false });
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
    if(auth) {
      setAlert({ key: Date.now(), title: 'Token created', message: 'Token has been created successfully.', success: true });
    } else {
      setAlert({ key: Date.now(), title: 'Authorization error', message: 'You cannot perform this action without authorization.', success: false });
    }
    setOpenAlert(true);
    setOpenModal(false);
  };

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
  }), [loaderData, expirationTime, firstSelectedService, secondSelectedService, selectedMethods, firstLabel, secondLabel, openAlert, openModal, alert]);

  const actions: Actions = useMemo(() => ({
    setExpirationTime, setFirstSelectedService, setSecondSelectedService, setSelectedMethods,
    onSubmit, onReset, callApi, setOpenAlert, setOpenModal,
  }), [setExpirationTime, setFirstSelectedService, setSecondSelectedService, setSelectedMethods, onSubmit, onReset, callApi, setOpenAlert, setOpenModal]);

  return <TokenFormContext.Provider value={{ state, actions }}>{children}</TokenFormContext.Provider>;
}

