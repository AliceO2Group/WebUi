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

import { useEffect } from 'react';

import { setStorageItem } from '~/utils/storage';

import { FormSelectMulti, FormSelectMultiOrdering } from '../form/form-select';
import { FormInput } from '../form/form-input';
import { useTokenFilters } from '~/hooks/tokens/token-filters';
import { FlexGrowWrapper, FlexGrowWrapperElement } from '~/ui/flex';

const _applyFilters = ({ services, ...filterStates }: any) => {
  // eslint-disable-next-line no-console
  console.log('Applying filters with state:', filterStates);
  setStorageItem('TKN_token-filters', filterStates);
};

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
export function TokenFilters() {
  // Deleting stored filters on component un-mount
  useEffect(() => () => {
    setStorageItem('TKN_token-filters', {});
  }, []);

  const { state, actions } = useTokenFilters();
  const {
    services,
    firstSelectedService,
    secondSelectedService,
    httpMethods,
    expirationDateMin,
    expirationDateMax,
    issueDateMin,
    issueDateMax,
    ordering,
  } = state;

  const {
    setServices,
    setFirstSelectedService,
    setSecondSelectedService,
    setHttpMethods,
    setExpirationDateMin,
    setExpirationDateMax,
    setIssueDateMin,
    setIssueDateMax,
    setOrdering,
    clearAllFilters,
  } = actions;

  const columns = [
    'ID', 'Issue Date', 'Expiration Date',
  ];

  const orderingOptions = [];
  for (const col of columns) {
    orderingOptions.push({ value: col.toLowerCase().replace(/\s+/g, '_'), label: col });
    orderingOptions.push({ value: `-${col.toLowerCase().replace(/\s+/g, '_')}`, label: `${col} (desc)` });
  }

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

  const applyFilters = () => {
    _applyFilters(state);
  };

  return <div>
    <FlexGrowWrapper>
      <FormSelectMulti
        id='first-selected-service'
        label="Service From:"
        options={services}
        value={firstSelectedService}
        setValue={setFirstSelectedService}/>
      <FormSelectMulti
        id='second-selected-service'
        label="Service To:"
        options={services}
        value={secondSelectedService}
        setValue={setSecondSelectedService} />
      <FormSelectMulti
        id='http-methods'
        label="HTTP Methods:"
        options={[
          { value: 'GET', label: 'GET' },
          { value: 'POST', label: 'POST' },
          { value: 'PUT', label: 'PUT' },
          { value: 'DELETE', label: 'DELETE' },
        ]} value={httpMethods} setValue={setHttpMethods} />
    </FlexGrowWrapper>
    <FlexGrowWrapper>
      <FormInput
        labelText="Expiration Date (min):"
        inputProps={{
          type: 'datetime-local',
        }}
        value={expirationDateMin}
        setValue={setExpirationDateMin}
      />
      <FormInput
        labelText="Expiration Date (max):"
        inputProps={{
          type: 'datetime-local',
        }}
        value={expirationDateMax}
        setValue={setExpirationDateMax}
      />
      <FormInput
        labelText="Issue Date (min):"
        inputProps={{
          type: 'datetime-local',
        }}
        value={issueDateMin}
        setValue={setIssueDateMin}
      />
      <FormInput
        labelText="Issue Date (max):"
        inputProps={{
          type: 'datetime-local',
        }}
        value={issueDateMax}
        setValue={setIssueDateMax}
      />
    </FlexGrowWrapper>
    <FlexGrowWrapper>
      <FormSelectMultiOrdering
        id='tags'
        label="Order by:"
        options={orderingOptions}
        value={ordering}
        setValue={setOrdering}
      />
      <FlexGrowWrapperElement className="self-center">
        <div className='flex-row g1 justify-end'>
          <button className="btn btn-primary" onClick={applyFilters}>Apply Filters</button>
          <button className="btn btn-danger" onClick={clearAllFilters}>Clear Filters</button>
        </div>
      </FlexGrowWrapperElement>
    </FlexGrowWrapper>
  </div>;

}
