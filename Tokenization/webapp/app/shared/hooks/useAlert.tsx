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

import { useContext } from 'react';
import { AlertContext, type AlertOptions } from '~/ui/alert/alert-provider';

/**
 * Hook useAlert to access alert pushing functionality.
 * @example
 * const pushAlert = useAlert();
 * pushAlert({ message: 'This is an alert', severity: 'success' });
 *
 * @returns {(options: AlertOptions) => void} Function to push an alert
 */
export function useAlert() {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return ctx.pushAlert;
}
