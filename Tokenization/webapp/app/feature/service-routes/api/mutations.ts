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

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { banServiceRoute, banServiceRoutesBulk } from '~/feature/service-routes/services/service-routes.service';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { serviceRoutesQueryKeys } from './queries';

export function useBanServiceRouteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => banServiceRoute(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRoutesQueryKeys.lists });
    },
  });
}

export function useBulkBanServiceRoutesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filters: ServiceRouteFilterValues) => banServiceRoutesBulk(filters),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRoutesQueryKeys.lists });
    },
  });
}
