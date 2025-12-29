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
import type { UseQueryResult } from '@tanstack/react-query';

import { useDebouncedValue } from '~/shared/hooks/useDebouncedValue';

const SERVICE_FILTER_FIELDS = ['serviceFrom', 'serviceTo'] as const;

export type ServiceFilterFieldName = typeof SERVICE_FILTER_FIELDS[number];

export type ServiceOptionsQueryHook<TOption> = (params: {
  searchTerm?: string;
  enabled?: boolean;
}) => UseQueryResult<TOption[]>;

export type UseServiceSelectFiltersOptions<TOption> = {
  queryHook: ServiceOptionsQueryHook<TOption>;
  debounceMs?: number;
  minChars?: number;
};

/**
 * useServiceSelectFilters is a custom hook to manage service select filters with debounced search.
 *
 * @param queryHook The query hook to fetch service options based on search term.
 * @param debounceMs The debounce time in milliseconds for the search input.
 * @param minChars The minimum number of characters required to trigger the search.
 * @returns An object containing search values, debounced values, query results, and input change handler.
 */
export function useServiceSelectFilters<TOption>({
  queryHook,
  debounceMs = 300,
  minChars = 2,
}: UseServiceSelectFiltersOptions<TOption>) {
  const [searchValues, setSearchValues] = useState<Record<ServiceFilterFieldName, string>>({
    serviceFrom: '',
    serviceTo: '',
  });

  const debouncedSearchValues = {
    serviceFrom: useDebouncedValue(searchValues.serviceFrom, debounceMs),
    serviceTo: useDebouncedValue(searchValues.serviceTo, debounceMs),
  };

  const queryByField: Record<ServiceFilterFieldName, ReturnType<typeof queryHook>> = {
    serviceFrom: queryHook({
      searchTerm: debouncedSearchValues.serviceFrom,
      enabled: debouncedSearchValues.serviceFrom.length >= minChars,
    }),
    serviceTo: queryHook({
      searchTerm: debouncedSearchValues.serviceTo,
      enabled: debouncedSearchValues.serviceTo.length >= minChars,
    }),
  };

  const handleInputValueChange = useCallback((field: ServiceFilterFieldName, value: string) => {
    setSearchValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  return {
    searchValues,
    debouncedSearchValues,
    queryByField,
    handleInputValueChange,
  };
}
