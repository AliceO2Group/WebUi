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
import type { Route } from './+types/overview';
import type { Token } from '../../components/tokens/token';

import React from 'react';
import { Link, Await } from 'react-router';
import { Spinner } from '~/ui/spinner';

/**
 * Client loader that fetches all tokens from the API.
 *
 * @returns Promise that resolves to an array of tokens
 */
export const clientLoader = async (): Promise<{ tokens: Promise<Token[]> }> => {
  const tokensPromise = fetch('/api/tokens')
    .then(r => r.json())
    .catch(_ => {
      throw new Error('An error occurred');
    });

  return {
    tokens: tokensPromise,
  };
};

/**
 * Table component that displays a list of tokens with their ID and validity.
 * Token IDs are clickable links that navigate to the token details page.
 *
 * @param tokens - Array of tokens to display
 */
function TokenTable({ tokens }: { tokens: Token[] }) {
  return  <table className={'table'}>
    <thead>
      <tr>
        <th>ID</th>
        <th>validity</th>
      </tr>
    </thead>
    <tbody>
      {tokens.map((token: Token) => <tr key={token.tokenId}>
        <td><Link to={`/tokens/${token.tokenId}`}>{token.tokenId}</Link></td>
        <td className={token.validity === 'bad' ? 'danger' : ''}>{token.validity}</td>
      </tr>)}
    </tbody>
  </table>;
}

/**
 * Tokens overview page component with tabbed interface.
 * Displays a list of tokens
 *
 * @param loaderData - Object containing the deferred tokens promise
 */
export default function Overview({ loaderData: { tokens } }: Route.ComponentProps) {
  return (
    <React.Suspense fallback={<Spinner/>}>
      <Await resolve={tokens}>
        {(data) => <TokenTable tokens={data} />}
      </Await>
    </React.Suspense>
  );
}
