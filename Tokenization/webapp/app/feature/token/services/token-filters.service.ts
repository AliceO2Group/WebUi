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

import type { TokenFilterValues } from '~/feature/token/types/token-filters';

/**
 *
 */
export function hasDataFilters(filters: TokenFilterValues) {
  return (
    filters.serviceFrom.length > 0 ||
    filters.serviceTo.length > 0 ||
    Boolean(filters.issuedAfter) ||
    Boolean(filters.issuedBefore) ||
    Boolean(filters.expiresAfter) ||
    Boolean(filters.expiresBefore)
  );
}

/**
 *
 */
export function validateFiltersForBulk(filters: TokenFilterValues): string | null {
  if (!hasDataFilters(filters)) {
    return 'At least one service or date filter must be provided.';
  }
  return null;
}
