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

import { useQuery } from '@tanstack/react-query';

import { fetchServices } from '~/feature/service/services/services.service';
import type { ServiceFilterValues } from '~/feature/service/types/service-filters';

const servicesListKey = ['services', 'list'] as const;

export const servicesQueryKeys = {
  all: ['services'] as const,
  lists: servicesListKey,
  list: (filters: ServiceFilterValues | null) => [...servicesListKey, filters] as const,
};

type UseServicesQueryParams = {
  filters: ServiceFilterValues | null;
  enabled?: boolean;
};

export function useServicesQuery({ filters, enabled = true }: UseServicesQueryParams) {
  return useQuery({
    queryKey: servicesQueryKeys.list(filters),
    enabled,
    queryFn: () => fetchServices(filters),
  });
}
