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

import type { ServiceRoute } from '~/feature/service-routes/types/service-route';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { appendTokenParam, buildUrl, createQueryParams, parseJsonOrThrow } from '~/shared/http/http.utils';

export type ServiceRoutesQueryResponse = {
  routes: ServiceRoute[];
  totalCount?: number;
};

export type ServiceRouteRegistrationPayload = {
  serviceFromId: string;
  serviceToId: string;
  permissions: string[];
};

/**
 * Appends service route filters to the given URLSearchParams object.
 *
 * @param queryString The URLSearchParams object to append filters to.
 * @param filters The service route filter values to append.
 */
function appendRouteFilters(queryString: URLSearchParams, filters?: ServiceRouteFilterValues | null) {
  if (!filters) {
    return;
  }

  if (filters.serviceTo.length > 0) {
    queryString.append('serviceTo', filters.serviceTo.map((service) => service.value).join(','));
  }
  if (filters.serviceFrom.length > 0) {
    queryString.append('serviceFrom', filters.serviceFrom.map((service) => service.value).join(','));
  }
}

/**
 * Fetches service routes based on the provided filters and token.
 *
 * @param filters The service route filter values to apply.
 * @param token Optional authentication token.
 * @returns A promise resolving to the service routes query response.
 */
export async function fetchServiceRoutes(
  filters: ServiceRouteFilterValues | null,
  token?: string | null,
): Promise<ServiceRoutesQueryResponse> {
  const queryString = new URLSearchParams();
  appendRouteFilters(queryString, filters);
  appendTokenParam(queryString, token);

  const url = buildUrl('/api/routes', queryString);
  const response = await fetch(url);
  const routes = await parseJsonOrThrow<ServiceRoute[]>(response, 'Fetching service routes');
  return {
    routes,
  };
}

/**
 * Bans a service route by its ID.
 *
 * @param routeId The ID of the service route to ban.
 * @param token Optional authentication token.
 */
export async function banServiceRoute(routeId: string, token?: string | null): Promise<void> {
  const url = buildUrl(`/api/routes/${routeId}`, createQueryParams(token));

  const res = await fetch(url, {
    method: 'DELETE',
  });

  await parseJsonOrThrow(res, 'Banning service route');
}

/**
 * Bans service routes in bulk based on the provided filters.
 *
 * @param filters The service route filter values to determine which routes to ban.
 * @param token Optional authentication token.
 */
export async function banServiceRoutesBulk(filters?: ServiceRouteFilterValues | null, token?: string | null): Promise<void> {
  if (!filters) {
    return Promise.reject(new Error('No filters provided for bulk ban.'));
  }

  const queryString = new URLSearchParams();
  appendRouteFilters(queryString, filters);
  appendTokenParam(queryString, token);

  const url = buildUrl('/api/routes', queryString);

  const res = await fetch(url, {
    method: 'DELETE',
  });

  await parseJsonOrThrow(res, 'Banning service routes in bulk');
}

/**
 * Registers a new service route with the provided payload.
 *
 * @param payload The service route registration payload.
 * @param token Optional authentication token.
 * @returns A promise resolving to the newly registered service route.
 */
export async function registerServiceRoute(
  payload: ServiceRouteRegistrationPayload,
  token?: string | null,
): Promise<ServiceRoute> {
  const url = buildUrl('/api/routes', createQueryParams(token));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return parseJsonOrThrow<ServiceRoute>(response, 'Registering service route');

}
