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
import { TokenFormContext } from '~/feature/token/contexts/token-form';

/**
 * Used to access Token Form context created for Token Form component.
 * in webapp/app/contexts/tokens/token-form.tsx
 */
export function useTokenForm() {
  const ctx = useContext(TokenFormContext);
  if (!ctx) {
    throw new Error('useTokenForm must be used inside TokenFormProvider');
  }
  return ctx;
}
