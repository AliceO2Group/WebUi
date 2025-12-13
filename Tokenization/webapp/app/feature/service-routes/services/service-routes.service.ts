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

import { mockServiceRoutes } from '~/feature/service-routes/mocks/service-routes.mock';
import type { ServiceRoute } from '~/feature/service-routes/types/service-route';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';

export type ServiceRoutesQueryResponse = {
  routes: ServiceRoute[];
  totalCount: number;
};

export async function fetchServiceRoutes(_filters: ServiceRouteFilterValues | null): Promise<ServiceRoutesQueryResponse> {
  return {
    routes: [...mockServiceRoutes],
    totalCount: mockServiceRoutes.length,
  };
}

export async function banServiceRoute(_routeId: string): Promise<void> {
  return Promise.resolve();
}

export async function banServiceRoutesBulk(_filters: ServiceRouteFilterValues): Promise<void> {
  return Promise.resolve();
}
