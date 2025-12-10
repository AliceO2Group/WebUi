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
import type { Token } from '../../types/token';

import { useEffect } from 'react';

import { useTokenFiltersAction, useTokenFiltersState } from '~/feature/token/hooks/token-filters';
import { TokenFiltersFirstRow,
  TokenFiltersSecondRow,
  TokenFiltersLastRow,
} from './TokenFiltersRow';
import { Form } from '~/shared/components/form/form';
import useTokenActions from '../../hooks/api/useTokenActions';
import { useTokenQueries } from '../../hooks/api/useTokenQueries';
import { Spinner } from '~/ui/spinner';
import type { TokenFilterPayload } from '../../services/tokenApi';

/**
 * TokenFilters
 *
 * Renders token filters form and manages its state via useTokenFilters hook.
 *
 * Notes:
 * - Non-reusable component specific logic is kept inside this component.
 *
 * @returns {JSX.Element} - rendered component
 */
export function TokenFilters({
  setFiltered,
  setData,
}: {
  setFiltered: React.Dispatch<React.SetStateAction<boolean>>;
  setData: React.Dispatch<React.SetStateAction<Token[]>>;
}) {

  const actions = useTokenFiltersAction();
  const state = useTokenFiltersState();
  const {
    filter,
  } = useTokenActions();
  const { services } = useTokenQueries();
  const servicesQuery = services();

  const {
    setServices,
    setAppliedFilters,
  } = actions;

  useEffect(() => {
    if (servicesQuery.data) {
      setServices(servicesQuery.data);
    }
  }, [servicesQuery.data, setServices]);

  const buildFilterPayload = (): TokenFilterPayload => ({
    servicesFrom: state.firstSelectedService,
    servicesTo: state.secondSelectedService,
    methods: state.httpMethods,
    expirationDateMin: state.expirationDateMin,
    expirationDateMax: state.expirationDateMax,
    issueDateMin: state.issueDateMin,
    issueDateMax: state.issueDateMax,
    ordering: state.ordering,
  });

  const normalizeFilters = (payload: TokenFilterPayload): TokenFilterPayload | null => {
    const entries = Object.entries(payload).filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return Boolean(value);
    });
    if (entries.length === 0) {
      return null;
    }
    return Object.fromEntries(entries) as TokenFilterPayload;
  };

  const applyFilters = async () => {
    const payload = buildFilterPayload();
    console.log('[TokenFilters] Applying filters with payload', payload);
    try {
      const response = await filter.mutateAsync(payload);
      console.log('[TokenFilters] Filter response', response);
      setFiltered(response.filtered);
      setData(response.tokens);
      setAppliedFilters(normalizeFilters(payload));
    } catch (error) {
      console.error('[TokenFilters] Filter request failed', error);
      throw error;
    }
  };

  return <div>
    {servicesQuery.isPending && <Spinner size={1.5} align={'left'} />}
    {servicesQuery.isError && <div role="alert">Failed to load services list.</div>}
    <Form onSubmit={(event) => {
      event.preventDefault(); applyFilters();
    }}>
      <TokenFiltersFirstRow />
      <TokenFiltersSecondRow />
      <TokenFiltersLastRow applyFilters={applyFilters} />
    </Form>
  </div>;

}
