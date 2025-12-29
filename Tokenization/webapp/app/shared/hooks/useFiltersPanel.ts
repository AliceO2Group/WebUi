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

type UseFiltersPanelOptions = {
  initiallyOpen?: boolean;
};

/**
 * UseFiltersPanel is a custom hook to manage the state and behavior of a filters panel.
 *
 * @param options Configuration options for the filters panel behavior.
 * @returns An object containing the state and handler functions for the filters panel.
 */
export function useFiltersPanel<TFilters>(options: UseFiltersPanelOptions = {}) {
  const { initiallyOpen = false } = options;
  const [filtersOpen, setFiltersOpen] = useState(initiallyOpen);
  const [appliedFilters, setAppliedFilters] = useState<TFilters | null>(null);

  const handleFiltersChange = useCallback((values: TFilters) => {
    setAppliedFilters(values);
  }, []);

  const toggleFiltersPanel = useCallback(() => {
    setFiltersOpen((prev) => !prev);
  }, []);

  const openFiltersPanel = useCallback(() => {
    setFiltersOpen(true);
  }, []);

  const closeFiltersPanel = useCallback(() => {
    setFiltersOpen(false);
  }, []);

  return {
    filtersOpen,
    toggleFiltersPanel,
    openFiltersPanel,
    closeFiltersPanel,
    appliedFilters,
    handleFiltersChange,
  };
}
