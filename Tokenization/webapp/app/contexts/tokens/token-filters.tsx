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

import React, { useCallback, useState } from 'react';

import type { OptionType } from '~/utils/types';

type State = {
  services: OptionType[];
  firstSelectedService: string[];
  secondSelectedService: string[];
  httpMethods: string[];
  expirationDateMin: string;
  expirationDateMax: string;
  issueDateMin: string;
  issueDateMax: string;
  ordering: string[];
};

type Actions = {
  setServices: React.Dispatch<React.SetStateAction<OptionType[]>>;
  setFirstSelectedService: React.Dispatch<React.SetStateAction<string[]>>;
  setSecondSelectedService: React.Dispatch<React.SetStateAction<string[]>>;
  setHttpMethods: React.Dispatch<React.SetStateAction<string[]>>;
  setExpirationDateMin: React.Dispatch<React.SetStateAction<string>>;
  setExpirationDateMax: React.Dispatch<React.SetStateAction<string>>;
  setIssueDateMin: React.Dispatch<React.SetStateAction<string>>;
  setIssueDateMax: React.Dispatch<React.SetStateAction<string>>;
  setOrdering: React.Dispatch<React.SetStateAction<string[]>>;
  clearAllFilters: () => void;
};

export const TokenFiltersContext = React.createContext<{ state: State; actions: Actions } | undefined>(undefined);

/**
 * TokenFiltersProvider
 *
 * Context provider component for token filters state management.
 *
 * @param {object} props - component props
 * @param {React.ReactNode} props.children - child components
 *
 * @returns {JSX.Element} - rendered component
 */
export function TokenFiltersProvider({ children }: { children: React.ReactNode }) {
  const [services, setServices] = useState<OptionType[]>([]);
  const [firstSelectedService, setFirstSelectedService] = useState<string[]>([]);
  const [secondSelectedService, setSecondSelectedService] = useState<string[]>([]);
  const [httpMethods, setHttpMethods] = useState<string[]>([]);
  const [expirationDateMin, setExpirationDateMin] = useState<string>('');
  const [expirationDateMax, setExpirationDateMax] = useState<string>('');
  const [issueDateMin, setIssueDateMin] = useState<string>('');
  const [issueDateMax, setIssueDateMax] = useState<string>('');
  const [ordering, setOrdering] = useState<string[]>([]);

  const clearAllFilters = useCallback(() => {
    setServices([]);
    setFirstSelectedService([]);
    setSecondSelectedService([]);
    setHttpMethods([]);
    setExpirationDateMin('');
    setExpirationDateMax('');
    setIssueDateMin('');
    setIssueDateMax('');
    setOrdering([]);
  }, [
    setServices,
    setFirstSelectedService,
    setSecondSelectedService,
    setHttpMethods,
    setExpirationDateMin,
    setExpirationDateMax,
    setIssueDateMin,
    setIssueDateMax,
    setOrdering,
  ]);

  const state = React.useMemo(() => ({
    services,
    firstSelectedService,
    secondSelectedService,
    httpMethods,
    expirationDateMin,
    expirationDateMax,
    issueDateMin,
    issueDateMax,
    ordering,
  }), [
    services,
    firstSelectedService,
    secondSelectedService,
    httpMethods,
    expirationDateMin,
    expirationDateMax,
    issueDateMin,
    issueDateMax,
    ordering,
  ]) ;

  const actions = React.useMemo(() => ({
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
  }), [
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
  ])  ;

  return <TokenFiltersContext.Provider value={{ state,  actions }}>
    {children}
  </TokenFiltersContext.Provider>;

}
