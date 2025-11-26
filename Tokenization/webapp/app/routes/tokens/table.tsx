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

import { Box1_2 } from '~/components/box';
import { Spinner } from '~/ui/spinner';
import { Await } from 'react-router';
import type { Token } from '~/components/tokens/token';
import { TokenTableWithIssuedAt } from '~/components/tokens/token-table';
import { TokenFilters } from '~/components/tokens/token-filters';

//eslint-disable-next-line jsdoc/require-jsdoc
export function clientLoader() {
  const tokens = fetch('/api/tokens')
    .then(response => {
      if (!response.ok) {
        throw new Error('An error occurred!');
      }
      return response.json();
    });

  return { tokens };
}

/**
 *
 */
export default function TokensTable() {
  const { tokens } = useLoaderData();
  return <Box1_2 link={null}>
    <Suspense fallback={<Spinner align='center' />}>
      <div className="mv3"></div>
      <TokenFilters />
      <Await resolve={tokens}>
        {(resolvedTokens: Token[]) => <TokenTableWithIssuedAt tokens={resolvedTokens}/>}
      </Await>
    </Suspense>
  </Box1_2>;
}
