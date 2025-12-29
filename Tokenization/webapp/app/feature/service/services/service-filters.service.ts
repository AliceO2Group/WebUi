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

import type { ServiceFilterValues } from '~/feature/service/types/service-filters';

/**
 * Checks if any service data filters are applied.
 *
 * @param filters The service filter values to check.
 * @returns True if any data filters are applied, false otherwise.
 */
export function hasServiceDataFilters(filters: ServiceFilterValues) {
  return Boolean(
    filters.issuedAfter ||
    filters.issuedBefore ||
    filters.expiresAfter ||
    filters.expiresBefore ||
    filters.search?.trim(),
  );
}

/**
 * Validates the service filters for bulk operations.
 * Ensures that at least one data filter is applied.
 *
 * @param filters The service filter values to validate.
 * @returns An error message string if validation fails, or null if validation passes.
 */
export function validateServiceFiltersForBulk(filters: ServiceFilterValues): string | null {
  if (!hasServiceDataFilters(filters)) {
    return 'At least one filter (date or name) must be provided.';
  }
  return null;
}
