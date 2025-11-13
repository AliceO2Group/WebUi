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
import type { Token } from '../../components/tokens/token';

import { Await, useLoaderData } from 'react-router';
import { Suspense } from 'react';

import { Spinner } from '~/ui/spinner';
import { Box1_2 } from "../../components/box"
import { useSetHeader } from '~/ui/header/headerContext';
import {TokenTable, TokenTableContent} from '../../components/tokens/token-table'


/**
 * Client loader that fetches all tokens from the API.
 *
 * @returns Promise that resolves to an array of tokens
 */
export const clientLoader = async (): Promise<{ tokens: Promise<Token[]>; }> => {
  const tokens = fetch('/api/tokens')
    .then(response => {
      if (!response.ok) {
          throw new Error('An error occurred!');
      }
      return response.json()
  });
  
  return { tokens };
};

/**
 * Tokens overview page component with tabbed interface.
 * Displays a list of tokens
 *
 * @param loaderData - Object containing the deferred tokens promise
 */
export default function Overview() {

  const {tokens} = useLoaderData()
  useSetHeader('Tokens');

  return (  
    <div className="grid-1-2">
      <Box1_2 link="/tokens/table">
        <TokenTable>
        <Suspense fallback={<Spinner/>}>
          <Await resolve={tokens}>
              {(resolvedTokens: Token[]) =>  <TokenTableContent tokens={resolvedTokens}/>} 
          </Await>
        </Suspense>
        </TokenTable>
      </Box1_2>
        
      <Box1_2 link="/tokens/new">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Create Token</h2>
          <p>Form to create a new token will go here.</p>
        </div>
      </Box1_2>
    </div>
  )
}
