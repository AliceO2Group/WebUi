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
 *
 */
export function useTokenFormState() {
  const ctx = useContext(TokenFormContext);
  if (!ctx) {
    throw new Error('useTokenFormState must be used inside TokenFormProvider');
  }
  const { state, actions } = ctx;

  return {
    firstSelectedService: state.firstSelectedService,
    secondSelectedService: state.secondSelectedService,
    selectedMethods: state.selectedMethods,
    firstLabel: state.firstLabel,
    secondLabel: state.secondLabel,
    expirationTime: state.expirationTime,
    setExpirationTime: actions.setExpirationTime,
    setFirstSelectedService: actions.setFirstSelectedService,
    setSecondSelectedService: actions.setSecondSelectedService,
    setSelectedMethods: actions.setSelectedMethods,
    onSubmit: actions.onSubmit,
    onReset: actions.onReset,
  };
}
