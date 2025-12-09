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

import { type DialogPropsBase } from '~/utils/types';

import {
  WindowTitle,
  WindowContent,
  WindowCloseIcon,
  WindowButtonCancel,
  WindowButtonAccept,
} from '../window/window-objects';
import Modal from '../window/modal';

interface ModalType {
  title: string;
  content: React.ReactNode;
  accent?: string;
  action: (() => void);
}

/**
 *
 */
export function ModalBase({
  modal,
  open,
  setOpen,
}: {
  modal: ModalType;
} & DialogPropsBase) {
  return <Modal
    open={open}
    setOpen={setOpen}
    className={modal.accent ?? 'bg-primary'}
  >
    <WindowTitle>{modal.title}</WindowTitle>
    <WindowContent>{modal.content}</WindowContent>
    <WindowCloseIcon />
    <WindowButtonCancel />
    <WindowButtonAccept action={modal.action} />
  </Modal>;
}
