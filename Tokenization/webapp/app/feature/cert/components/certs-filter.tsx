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
import { useState } from "react";

import { FlexGrowWrapper, FlexGrowWrapperElement } from "~/ui/flex";
import { FormInputString, FormInputDatetime } from "~/shared/components/form/form-input";
import { FormSelectMultiOrdering } from "~/shared/components/form/form-select";
import { setStorageItem } from "~/utils/storage";

const _applyFilters = ({ services, ...filterStates }: any) => {
  // eslint-disable-next-line no-console
  console.log('Applying filters with state:', filterStates);
  setStorageItem('TKN_token-filters', filterStates);
};


export function CertsFilter() {
  const [expirationDateMin, setExpirationDateMin] = useState('');
  const [expirationDateMax, setExpirationDateMax] = useState('');
  const [issueDateMin, setIssueDateMin] = useState('');
  const [issueDateMax, setIssueDateMax] = useState('');
  const [ipAddress, setIpAddress] = useState('');

  const [ordering, setOrdering] = useState([]);

  const columns = [
    'ID', 'Issue Date', 'Expiration Date',
  ];

  const orderingOptions = [];
  for (const col of columns) {
    orderingOptions.push({ value: col.toLowerCase().replace(/\s+/g, '_'), label: col });
    orderingOptions.push({ value: `-${col.toLowerCase().replace(/\s+/g, '_')}`, label: `${col} (desc)` });
  }

  const applyFilters = () => {
    _applyFilters({
      expirationDateMin,
      expirationDateMax,
      issueDateMin,
      issueDateMax,
      ordering,
    });
  }

  const clearAllFilters = () => {
    setExpirationDateMin('');
    setExpirationDateMax('');
    setIssueDateMin('');
    setIssueDateMax('');
    setOrdering([]);
  }


  return <>
      <FlexGrowWrapper>
          <FormInputDatetime
            labelText="Expiration Date (min):"
            name='expiration-date-min'
            value={expirationDateMin}
            setValue={setExpirationDateMin}
          />
          <FormInputDatetime
            labelText="Expiration Date (max):"
            name='expiration-date-max'
            value={expirationDateMax}
            setValue={setExpirationDateMax}
          />
          <FormInputDatetime
            labelText="Issue Date (min):"
            name='issue-date-min'
            value={issueDateMin}
            setValue={setIssueDateMin}
          />
          <FormInputDatetime
            labelText="Issue Date (max):"
            name='issue-date-max'
            value={issueDateMax}
            setValue={setIssueDateMax}
          />
    </FlexGrowWrapper>
    <FlexGrowWrapper>
        <FormInputString
          labelText="IP Address:"
          name='ip-address'
          value={ipAddress}
          setValue={setIpAddress}
        />
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
    </>;
}