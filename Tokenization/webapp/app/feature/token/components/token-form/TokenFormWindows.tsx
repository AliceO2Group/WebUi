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

import { useMemo, type Dispatch, type SetStateAction } from 'react';
import type { HttpMethod, OptionType } from '~/utils/types';

import Modal from '~/shared/components/window/modal';
import Alert from '~/shared/components/window/alert';
import ConfirmModalContent from './ConfirmModal';
import { WindowButtonAccept,
  WindowButtonCancel,
  WindowCloseIcon,
  WindowTitle,
  WindowContent,
} from '~/shared/components/window/window-objects';
import type { AlertType } from '~/shared/components/window/alert';

/**
 * Not reusable Windows prepared for Token Form component
 */

type TokenFormWindowsProps = {
  serviceOptions?: OptionType[];
  firstSelectedService: string;
  secondSelectedService: string;
  selectedMethods: HttpMethod[];
  expirationTime: string;
  openModal: boolean;
  setOpenModal: Dispatch<SetStateAction<boolean>>;
  alert: AlertType | null;
  openAlert: boolean;
  setOpenAlert: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => void;
};

export default function TokenFormWindows({
  serviceOptions,
  firstSelectedService,
  secondSelectedService,
  selectedMethods,
  expirationTime,
  openModal,
  setOpenModal,
  alert,
  openAlert,
  setOpenAlert,
  onConfirm,
}: TokenFormWindowsProps) {
  const { firstLabel, secondLabel } = useMemo(() => {
    const findLabel = (value: string) => serviceOptions?.find(option => option.value === value)?.label ?? '';
    return {
      firstLabel: findLabel(firstSelectedService),
      secondLabel: findLabel(secondSelectedService),
    };
  }, [firstSelectedService, secondSelectedService, serviceOptions]);

  return <>
    <Modal open={openModal} setOpen={setOpenModal} className="bg-primary">
      {ConfirmModalContent({
        firstLabel,
        secondLabel,
        expirationTime,
        methods: selectedMethods,
      })}
      <WindowButtonAccept className="btn-success" action={onConfirm} />
      <WindowButtonCancel />
    </Modal>
    <Alert
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
