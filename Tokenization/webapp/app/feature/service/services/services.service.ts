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

import { mockServices } from '~/feature/service/mocks/services.mock';
import type { Service } from '~/feature/service/types/service';
import type { ServiceFilterValues } from '~/feature/service/types/service-filters';

export type ServicesQueryResponse = {
  services: Service[];
};

export async function fetchServices(_filters: ServiceFilterValues | null): Promise<ServicesQueryResponse> {
  const queryString = new URLSearchParams();
  
  if(_filters) {
    if (_filters.issuedBefore) {
      queryString.append('issuedBefore', _filters.issuedBefore);
    }
    if (_filters.issuedAfter) {
      queryString.append('issuedAfter', _filters.issuedAfter);
    }
    if (_filters.expiresBefore) {
      queryString.append('expiresBefore', _filters.expiresBefore);
    }
    if (_filters.expiresAfter) {
      queryString.append('expiresAfter', _filters.expiresAfter);
    }
    if (_filters.search) {
      queryString.append('search', _filters.search);
    }
    if (_filters.ordering.length > 0) {
      queryString.append('ordering', _filters.ordering.map((order) => `${order.field}:${order.direction}`).join(','));
    }
  }

  const url = `/api/services?${queryString.toString()}`;

  const res = await fetch(url);
  const allServices: Service[] = await res.json();
  return {
    services: allServices,
  };
}
