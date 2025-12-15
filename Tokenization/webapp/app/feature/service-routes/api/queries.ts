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

import { fetchServiceRoutes } from '~/feature/service-routes/services/service-routes.service';
import { fetchServiceRouteOptions } from '~/feature/service-routes/services/service-route-options.service';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';

const serviceRouteListsKey = ['service-routes', 'list'] as const;

export const serviceRoutesQueryKeys = {
  list: (filters: ServiceRouteFilterValues | null) => [...serviceRouteListsKey, filters] as const,
  serviceOptionsSearch: (term: string) => ['service-routes', 'service-options', term] as const,
};

type UseServiceRoutesQueryParams = {
  filters: ServiceRouteFilterValues | null;
  enabled?: boolean;
};

export function useServiceRoutesQuery({ filters, enabled = true }: UseServiceRoutesQueryParams) {
  return useQuery({
    queryKey: serviceRoutesQueryKeys.list(filters),
    enabled,
    queryFn: () => fetchServiceRoutes(filters),
  });
}

type UseRouteServiceOptionsParams = {
  searchTerm?: string;
  enabled?: boolean;
};

export function useRouteServiceOptionsQuery(params?: UseRouteServiceOptionsParams) {
  const searchTerm = params?.searchTerm ?? '';
  return useQuery({
    queryKey: serviceRoutesQueryKeys.serviceOptionsSearch(searchTerm),
    queryFn: () => fetchServiceRouteOptions(searchTerm),
    enabled: params?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}
