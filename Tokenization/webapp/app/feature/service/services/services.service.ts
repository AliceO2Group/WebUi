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

import type { Service } from '~/feature/service/types/service';
import type { ServiceFilterValues } from '~/feature/service/types/service-filters';
import { appendTokenParam, buildUrl, parseJsonOrThrow } from '~/shared/http/http.utils';

export type ServicesQueryResponse = {
  services: Service[];
  totalCount?: number;
};

/**
 * Appends service filters to the given URLSearchParams object.
 *
 * @param queryString The URLSearchParams object to append filters to.
 * @param filters The service filter values to append.
 */
function appendServiceFilters(queryString: URLSearchParams, filters?: ServiceFilterValues | null) {
  if (!filters) {
    return;
  }

  if (filters.issuedBefore) {
    queryString.append('issuedBefore', filters.issuedBefore);
  }
  if (filters.issuedAfter) {
    queryString.append('issuedAfter', filters.issuedAfter);
  }
  if (filters.expiresBefore) {
    queryString.append('expiresBefore', filters.expiresBefore);
  }
  if (filters.expiresAfter) {
    queryString.append('expiresAfter', filters.expiresAfter);
  }
  if (filters.search) {
    queryString.append('search', filters.search);
  }
  if (filters.ordering.length > 0) {
    queryString.append('ordering', filters.ordering.map((order) => `${order.field}:${order.direction}`).join(','));
  }
}

/**
 * Fetches services based on the provided filters and token.
 *
 * @param filters The service filter values to apply.
 * @param token Optional authentication token.
 * @returns A promise resolving to the services query response.
 */
export async function fetchServices(filters: ServiceFilterValues | null, token?: string | null): Promise<ServicesQueryResponse> {
  const queryString = new URLSearchParams();
  appendServiceFilters(queryString, filters);
  appendTokenParam(queryString, token);

  const url = buildUrl('/api/services', queryString);
  const res = await fetch(url);
  const allServices = await parseJsonOrThrow<Service[]>(res, 'Fetching services');
  return {
    services: allServices,
  };
}
