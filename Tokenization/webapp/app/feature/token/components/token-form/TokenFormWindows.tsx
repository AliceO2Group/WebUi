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

import Modal from '~/shared/components/window/modal';
import Alert from '~/shared/components/window/alert';
import ConfirmModalContent from './ConfirmModal';
import { WindowButtonAccept,
  WindowButtonCancel,
  WindowCloseIcon,
  WindowTitle,
  WindowContent,
} from '~/shared/components/window/window-objects';
import { useTokenFormMeta, useTokenFormState, useTokenFormUi } from '~/feature/token/hooks/token-form/index';
import { useAuth } from '~/feature/auth/hooks/session';

/**
 * Not reusable Windows prepared for Token Form component
 */
export default function TokenFormWindows() {
  const { fetcher, submit } = useTokenFormMeta();

  const auth = useAuth('admin');
  const {
    setAlert,
    setOpenAlert,
    setOpenModal,
  } = useTokenFormUi();

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
  }, [fetcher.state, fetcher.data, setAlert, setOpenAlert]);

  return <TokenFormWindowsUI callApi={callApi}/>;
}

/**
 *
 */
function TokenFormWindowsUI({ callApi }: { callApi: () => void }) {
  const { firstLabel,
    secondLabel,
    selectedMethods,
    expirationTime,
  } = useTokenFormState();

  const { alert,
    openModal,
    openAlert,
    setOpenAlert,
    setOpenModal,
  } = useTokenFormUi();

  return <>
    <Modal open={openModal} setOpen={setOpenModal} className="bg-primary">
      {ConfirmModalContent({
        firstLabel,
        secondLabel,
        expirationTime,
        methods: selectedMethods,
      })}
      <WindowButtonAccept className="btn-success" action={callApi} />
      <WindowButtonCancel />
    </Modal>
    <Alert
      key={alert?.key}
      open={openAlert}
      setOpen={setOpenAlert}
      timeout={6000}
      className={alert?.success ? 'bg-success' : 'bg-danger'}
    >
      <WindowTitle>{alert?.title}</WindowTitle>
      <WindowContent>{alert?.message}</WindowContent>
      <WindowCloseIcon />
    </Alert>
  </>;
}
