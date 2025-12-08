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
import { setStorageItem } from '~/utils/storage';
import { useTokenFiltersAction, useTokenFiltersState } from '~/feature/token/hooks/token-filters';

/**
 *
 */
export default function useTokenFiltersLogic({ onSubmit }: { onSubmit?: () => void } = {}) {
  const state = useTokenFiltersState();
  const actions = useTokenFiltersAction();

  const { setServices } = actions;

  useEffect(() => () => {
    setStorageItem('TKN_token-filters', {});
  }, []);

  useEffect(() => {
    // Load services from API mock
    const t = setTimeout(() => {
      setServices([
        { value: 'service1', label: 'Service 1' },
        { value: 'service2', label: 'Service 2' },
        { value: 'service3', label: 'Service 3' },
        { value: 'service4', label: 'Service 4' },
      ]);
    }, 500);

    return () => clearTimeout(t);
  }, [setServices]);

  const applyFilters = () => {
    // Persist filters
    const { services, ...filterStates } = state as any;
    setStorageItem('TKN_token-filters', filterStates);
    // Optionally submit the surrounding form
    onSubmit?.();
  };

  return {
    state,
    actions,
    applyFilters,
  } as const;
}
