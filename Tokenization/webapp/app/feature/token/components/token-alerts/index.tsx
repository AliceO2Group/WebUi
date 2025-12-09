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

import AlertAuthError from '~/shared/components/alerts/alert-auth-error';
import { AlertBase } from '~/shared/components/alerts/alert-base';
import { ALERT_BANNED_FAULT,
  ALERT_BANNED_SUCCESS,
  ALERT_UNBANNED_FAULT,
  ALERT_UNBANNED_SUCCESS,
} from './AlertContent';

const ALERT_VARIANTS = {
  'auth-error': AlertAuthError,
  'token-banned-success': AlertBanSuccess,
  'token-banned-failed': AlertBanFault,
  'token-unbanned-success': AlertUnbanSuccess,
  'token-unbanned-failed': AlertUnbanFault,
};

export type AlertVariant = keyof typeof ALERT_VARIANTS;

/**
 *
 */
function AlertUnbanFault({ open, setOpen }: DialogPropsBase) {
  return <AlertBase alert={ALERT_UNBANNED_FAULT} open={open} setOpen={setOpen} />;
}

/**
 *
 */
function AlertBanFault({ open, setOpen }: DialogPropsBase) {
  return <AlertBase alert={ALERT_BANNED_FAULT} open={open} setOpen={setOpen} />;
}

/**
 *
 */
function AlertUnbanSuccess({ open, setOpen }: DialogPropsBase) {
  return <AlertBase alert={ALERT_UNBANNED_SUCCESS} open={open} setOpen={setOpen} />;
}

/**
 *
 */
function AlertBanSuccess({ open, setOpen }: DialogPropsBase) {
  return <AlertBase alert={ALERT_BANNED_SUCCESS} open={open} setOpen={setOpen} />;
}

/**
 *
 */
export default function TokenAlert({
  variant,
  open,
  setOpen }:
{
  variant: AlertVariant;
} & DialogPropsBase,
) {
  const Comp = ALERT_VARIANTS[variant];
  return Comp ? <Comp open={open} setOpen={setOpen} /> : null;
}
