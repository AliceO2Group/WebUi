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

import type { DialogPropsBase } from '~/utils/types';
import { AlertBase } from './alert-base';

const AUTH_ERROR_ALERT = {
  title: 'Authorization error',
  message: 'You cannot perform this action without authorization.',
  success: false,
};

/**
 *
 */
export default function AlertAuthError({ open, setOpen }: DialogPropsBase) {
  return <AlertBase alert={AUTH_ERROR_ALERT} open={open} setOpen={setOpen} />;
}
