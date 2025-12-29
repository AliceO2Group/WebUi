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
 * Checks if any service route filters are applied.
 *
 * @param filters The service route filter values to check.
 * @returns True if any filters are applied, false otherwise.
 */
export function hasRouteFilters(filters: ServiceRouteFilterValues) {
  return Boolean(
    (filters.serviceFrom?.length) ||
    (filters.serviceTo?.length),
  );
}

/**
 * Validates the service route filters for bulk operations.
 * Ensures that at least one service filter is applied.
 *
 * @param filters The service route filter values to validate.
 * @returns An error message string if validation fails, or null if validation passes.
 */
export function validateRouteFiltersForBulk(filters: ServiceRouteFilterValues): string | null {
  if (!hasRouteFilters(filters)) {
    return 'Add at least one service filter before running bulk ban.';
  }
  return null;
}
