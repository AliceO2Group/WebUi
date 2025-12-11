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

import { useCallback, useState } from 'react';

import type { TokenFilterValues } from '~/feature/token/types/token-filters';

/**
 *
 */
export function useTokenFiltersPanel() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TokenFilterValues | null>(null);

  const handleFiltersChange = useCallback((values: TokenFilterValues) => {
    setAppliedFilters(values);
  }, []);

  const toggleFiltersPanel = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  return {
    filtersOpen,
    toggleFiltersPanel,
    appliedFilters,
    handleFiltersChange,
  };
}
