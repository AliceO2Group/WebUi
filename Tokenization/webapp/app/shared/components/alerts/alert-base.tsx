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

import { type AlertType } from '../window/alert';
import { WindowTitle,
  WindowContent,
  WindowCloseIcon } from '../window/window-objects';
import Alert from '../window/alert';
import type { DialogPropsBase } from '~/utils/types';

/**
 *
 */
export function AlertBase({
  alert,
  open,
  setOpen,
}: {
  alert: AlertType;
} & DialogPropsBase) {
  return <Alert
    open={open}
    setOpen={setOpen}
    timeout={6000}
    className={alert.success ? 'bg-success' : 'bg-danger'}
  >
    <WindowTitle>{alert.title}</WindowTitle>
    <WindowContent>{alert.message}</WindowContent>
    <WindowCloseIcon />
  </Alert>;

}
