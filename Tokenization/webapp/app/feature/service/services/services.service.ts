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
import { hasServiceDataFilters } from '~/feature/service/services/service-filters.service';

export type ServicesQueryResponse = {
  services: Service[];
  totalCount: number;
  validationErr: string | null;
};

export async function fetchServices(filters: ServiceFilterValues | null): Promise<ServicesQueryResponse> {
  const validationErr = filters && !hasServiceDataFilters(filters)
    ? 'At least one date filter must be provided.'
    : null;

  return {
    services: [...mockServices],
    totalCount: mockServices.length,
    validationErr,
  };
}
