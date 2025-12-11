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

/**
 * useServicesOptions retrieves service names to feed token filter multi-selects.
 * It tries hitting the /api/services endpoint and falls back to provided seeds
 * if the backend is unavailable.
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchAvailableServices } from '~/feature/token/services/service-options.service';

export function useServicesOptions(seed: string[] = []) {
  const initialData = useMemo(
    () => Array.from(new Set(seed)).sort(),
    [seed]
  );

  const { data = initialData, isFetching } = useQuery({
    queryKey: ['token-service-options'],
    queryFn: fetchAvailableServices,
    initialData,
    staleTime: 5 * 60 * 1000,
  });

  return { options: data, loading: isFetching };
}
