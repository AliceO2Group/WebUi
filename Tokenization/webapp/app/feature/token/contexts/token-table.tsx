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

import { useState, createContext } from 'react';
import { useFetcher } from 'react-router';

type TokenTableState = {
  openM: boolean;
  openA: boolean;
  tokenId: string;
  modalVariant: string;
  key: number;
};

type Actions = {
  setOpenM: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenA: React.Dispatch<React.SetStateAction<boolean>>;
  setTokenId: React.Dispatch<React.SetStateAction<string>>;
  setModalVariant: React.Dispatch<React.SetStateAction<string>>;
  setKey: React.Dispatch<React.SetStateAction<number>>;
};

export const TokenTableContext = createContext<
  { state: TokenTableState; 
    actions: Actions; 
    fetcher: ReturnType<typeof useFetcher> 
  } | undefined> (undefined);

/**
 *
 */
export function TokenTableProvider({ children }: { children: React.ReactNode }) {
  const [openM, setOpenM] = useState<boolean>(false);
  const [openA, setOpenA] = useState<boolean>(false);
  const [tokenId, setTokenId] = useState<string>('');
  const [modalVariant, setModalVariant] = useState<string>('');
  const [key, setKey] = useState<number>(0); // Used to force re-mount of Alert component

  const fetcher = useFetcher(); // fetcher for ban and unban actions on the table level

  const state: TokenTableState = {
    openM,
    openA,
    tokenId,
    modalVariant,
    key,
  };

  const actions: Actions = {
    setOpenM,
    setOpenA,
    setTokenId,
    setModalVariant,
    setKey,
  };

  return <TokenTableContext.Provider value={{ state, actions, fetcher }}>
    {children}
  </TokenTableContext.Provider>;
}
