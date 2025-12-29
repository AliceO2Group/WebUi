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

import { banServiceRoute,
  banServiceRoutesBulk,
  registerServiceRoute,
  type ServiceRouteRegistrationPayload,
} from '~/feature/service-routes/services/service-routes.service';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { serviceRoutesQueryKeys } from './queries';
import { useSession } from '~/feature/auth/hooks/session';

/**
 * Mutation to ban a service route which invalidates the service routes list query on success.
 * Passed the auth token from the session to the service function.
 */
export function useBanServiceRouteMutation() {
  const { token } = useSession();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => banServiceRoute(routeId, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRoutesQueryKeys.lists });
    },
  });
}

/**
 * Mutation to bulk ban service routes which invalidates the service routes list query on success.
 * Passed the auth token from the session to the service function.
 */
export function useBulkBanServiceRoutesMutation() {
  const { token } = useSession();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filters: ServiceRouteFilterValues) => banServiceRoutesBulk(filters, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRoutesQueryKeys.lists });
    },
  });
}

/**
 * Mutation to register a new service route which invalidates the service routes list query on success.
 * Passed the auth token from the session to the service function.
 */
export function useRegisterServiceRouteMutation() {
  const { token } = useSession();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ServiceRouteRegistrationPayload) => registerServiceRoute(payload, token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceRoutesQueryKeys.lists });
    },
  });
}
