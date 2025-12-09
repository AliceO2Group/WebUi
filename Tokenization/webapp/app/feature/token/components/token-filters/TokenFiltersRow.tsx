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

import FilterRow from '~/shared/components/filters/filter-row';
import { FormInputDatetime } from '~/shared/components/form/form-input';
import { FormSelectMulti, FormSelectMultiOrdering } from '~/shared/components/form/form-select';
import { useTokenFiltersState, useTokenFiltersAction } from '../../hooks/token-filters';
import { FlexGrowWrapper, FlexGrowWrapperElement } from '~/ui/flex';

/**
 *
 */
export function TokenFiltersFirstRow() {
  const {
    services,
    firstSelectedService,
    secondSelectedService,
    httpMethods,
  } = useTokenFiltersState();

  const {
    setFirstSelectedService,
    setSecondSelectedService,
    setHttpMethods,
  } = useTokenFiltersAction();

  const filterRowData = [
    {
      id: 'first-selected-service',
      label: 'Service From:',
      options: services,
      value: firstSelectedService,
      setValue: setFirstSelectedService,
      render: FormSelectMulti,
    },
    {
      id: 'second-selected-service',
      label: 'Service To:',
      options: services,
      value: secondSelectedService,
      setValue: setSecondSelectedService,
      render: FormSelectMulti,
    },
    {
      id: 'http-methods',
      label: 'HTTP Methods:',
      options: [
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PUT', label: 'PUT' },
        { value: 'DELETE', label: 'DELETE' },
      ],
      value: httpMethods,
      setValue: setHttpMethods,
      render: FormSelectMulti,
    },
  ];

  return <FilterRow filterRowData={filterRowData} />;
}

/**
 *
 */
export function TokenFiltersSecondRow() {
  const {
    expirationDateMin,
    expirationDateMax,
    issueDateMin,
    issueDateMax,
  } = useTokenFiltersState();

  const {
    setExpirationDateMin,
    setExpirationDateMax,
    setIssueDateMin,
    setIssueDateMax,
  } = useTokenFiltersAction();

  const filterRowData = [
    {
      id: 'expiration-date-min',
      label: 'Expiration Date (min):',
      value: expirationDateMin,
      setValue: setExpirationDateMin,
      options: null,
      render: FormInputDatetime,
    },
    {
      id: 'expiration-date-max',
      label: 'Expiration Date (max):',
      value: expirationDateMax,
      setValue: setExpirationDateMax,
      options: null,
      render: FormInputDatetime,
    },
    {
      id: 'issue-date-min',
      label: 'Issue Date (min):',
      value: issueDateMin,
      setValue: setIssueDateMin,
      options: null,
      render: FormInputDatetime,
    },
    {
      id: 'issue-date-max',
      label: 'Issue Date (max):',
      value: issueDateMax,
      setValue: setIssueDateMax,
      options: null,
      render: FormInputDatetime,
    },
  ];

  return <FilterRow filterRowData={filterRowData} />;
}

/**
 *
 */
export function TokenFiltersLastRow({
  applyFilters,
}: {
  applyFilters: () => void;
}) {

  const {
    ordering,
  } = useTokenFiltersState();

  const {
    setOrdering,
    clearAllFilters,
  } = useTokenFiltersAction();

  const columns = [
    'ID', 'Issue Date', 'Expiration Date',
  ];

  const orderingOptions = [];
  for (const col of columns) {
    orderingOptions.push({ value: col.toLowerCase().replace(/\s+/g, '_'), label: col });
    orderingOptions.push({ value: `-${col.toLowerCase().replace(/\s+/g, '_')}`, label: `${col} (desc)` });
  }

  return (
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
  );
}
