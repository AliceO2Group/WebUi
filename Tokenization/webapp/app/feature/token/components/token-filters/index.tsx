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

import { setStorageItem } from '~/utils/storage';

import { useTokenFiltersAction, useTokenFiltersState } from '~/feature/token/hooks/token-filters';
import { TokenFiltersFirstRow,
  TokenFiltersSecondRow,
  TokenFiltersLastRow,
} from './TokenFiltersRow';
import { Form } from '~/shared/components/form/form';
import useForm from '~/shared/components/form/hooks/useForm';

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
  // Deleting stored filters on component un-mount
  useEffect(() => () => {
    setStorageItem('TKN_token-filters', {});
  }, []);

  const actions = useTokenFiltersAction();

  const {
    setServices,
  } = actions;

  useEffect(() => {
    // Load services from API mock
    setTimeout(() => {
      setServices([
        { value: 'service1', label: 'Service 1' },
        { value: 'service2', label: 'Service 2' },
        { value: 'service3', label: 'Service 3' },
        { value: 'service4', label: 'Service 4' },
      ]);
    }, 500);

  }, [setServices]);

  const { fetcher, ref, submit } = useForm();

  useEffect(() => {
    if (fetcher.state === 'idle' && (fetcher.data as any)?.success === true) {
      if (fetcher.data.filtered) {
        setFiltered(true);
      } else {
        setFiltered(false);
      }
      setData((fetcher.data as any).tokens);
    }
  }, [fetcher.state, fetcher.data, setData, setFiltered]);


  return <div>
    <Form submitRef={ref} fetcher={fetcher} action='/tokens/filter'>
      <TokenFiltersFirstRow />
      <TokenFiltersSecondRow />
      <TokenFiltersLastRow applyFilters={() => submit()} />
    </Form>
  </div>;

}
