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

import { Suspense } from 'react';
import { useLoaderData } from 'react-router';

import { Box1_2 } from '~/ui/box';
import { Spinner } from '~/ui/spinner';
import { Await } from 'react-router';
import type { Token } from '~/feature/token/types/token';
import { TokenTableExtended } from '~/feature/token/components/token-table';
import { TokenFilters } from '~/feature/token/components/token-filters';
import { TokenFiltersProvider } from '~/feature/token/contexts/token-filters';

//eslint-disable-next-line jsdoc/require-jsdoc
export async function clientLoader() {
  const tokens = fetch('/api/tokens')
    .then(async response => {
      if (!response.ok) {
        throw new Error('An error occurred!');
      }
      const json = await response.json();
      if (Array.isArray(json)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return json.map((t: any) => ({ ...t, id: t.tokenId ?? t.id }));
      }
      return { ...json, id: json.tokenId ?? json.id };

    });

  return { tokens };
}

//eslint-disable-next-line jsdoc/require-jsdoc
export default function TokensTable() {
  const { tokens } = useLoaderData();
  return <TokenFiltersProvider>
    <Box1_2 link={null}>
      <div className="mv2"></div>
      <TokenFilters />
      <Suspense fallback={<Spinner align='center' />}>
        <Await resolve={tokens}>
          {(resolvedTokens: Token[]) => <TokenTableExtended tokens={resolvedTokens}/>}
        </Await>
      </Suspense>
    </Box1_2>
  </TokenFiltersProvider>;
}
