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

import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';

/**
 *
 */
export function hasRouteFilters(filters: ServiceRouteFilterValues) {
  return Boolean(
    (filters.serviceFrom && filters.serviceFrom.length) ||
    (filters.serviceTo && filters.serviceTo.length),
  );
}

/**
 *
 */
export function validateRouteFiltersForBulk(filters: ServiceRouteFilterValues): string | null {
  if (!hasRouteFilters(filters)) {
    return 'Add at least one service filter before running bulk ban.';
  }
  return null;
}
