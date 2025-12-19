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

export type ServiceRoutesQueryResponse = {
  routes: ServiceRoute[];
  totalCount?: number;
};

export type ServiceRouteRegistrationPayload = {
  serviceFromId: string;
  serviceToId: string;
  permissions: string[];
};

export async function fetchServiceRoutes(
  _filters: ServiceRouteFilterValues | null,
  token?: string | null,
): Promise<ServiceRoutesQueryResponse> {
  const queryString = new URLSearchParams();
   
  if(_filters) {
    if (_filters.serviceTo.length > 0) {
      const servicesTo = _filters.serviceTo.map(service => service.value).join(',');
      queryString.append('serviceTo', servicesTo);
    }
    if (_filters.serviceFrom.length > 0) {
      const servicesFrom = _filters.serviceFrom.map(service => service.value).join(',');
      queryString.append('serviceFrom', servicesFrom);
    }
  }
  if (token) {
    queryString.append('token', token);
  }

  const query = queryString.toString();
  const url = query ? `/api/routes?${query}` : '/api/routes';
  
  const response = await fetch(url);

  if(!response.ok) {
    const err = await response.json();
    throw new Error(err.error);
  }

  const data = await response.json();
  return {
    routes: data,
  };
}

export async function banServiceRoute(_routeId: string, token?: string | null): Promise<void> {
  const params = new URLSearchParams();
  if (token) {
    params.append('token', token);
  }
  const query = params.toString();
  const url = query ? `/api/routes/${_routeId}?${query}` : `/api/routes/${_routeId}`;

  const res = await fetch(url, {
    method: 'DELETE'
  })

  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }

  const success = await res.json();  
  return success.success
}

export async function banServiceRoutesBulk(_filters: ServiceRouteFilterValues, token?: string | null): Promise<void> {
  if(!_filters) {
    return Promise.reject(new Error('No filters provided for bulk ban.'));
  }

  const queryString = new URLSearchParams();

  if (_filters.serviceTo.length > 0) {
    const servicesTo = _filters.serviceTo.map(service => service.value).join(',');
    queryString.append('serviceTo', servicesTo);
  }
  if (_filters.serviceFrom.length > 0) {
    const servicesFrom = _filters.serviceFrom.map(service => service.value).join(',');
    queryString.append('serviceFrom', servicesFrom);
  }
  if (token) {
    queryString.append('token', token);
  }

  const query = queryString.toString();
  const url = query ? `/api/routes?${query}` : '/api/routes';

  console.log('Bulk ban URL:', url);

  const res = await fetch(url, {
    method: 'DELETE',
  });

  if(!res.ok) {
    const err = await res.json();
    throw new Error(err.error);
  }

  const success = await res.json();
  return success.success;
}

export async function registerServiceRoute(
  payload: ServiceRouteRegistrationPayload,
  token?: string | null,
): Promise<ServiceRoute> {
  const params = new URLSearchParams();
  if (token) {
    params.append('token', token);
  }
  const query = params.toString();
  const url = query ? `/api/routes?${query}` : '/api/routes';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  const data = await response.json();

  if(!response.ok) {
    throw new Error(data.error);
  }

  return data

}
