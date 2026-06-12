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

import type { Route } from './+types/details';
import { Await, data, Link } from 'react-router';
import { Suspense } from 'react';

import type { Token } from '../../components/tokens/token';
import type { Log } from '~/components/logs/log';
import { TokenLogs } from '~/components/tokens/token-logs';
import { Spinner } from '~/ui/spinner';

/**
 * Fetches a token by its ID from the API.
 *
 * @param tokenId - The ID of the token to fetch
 * @returns Promise that resolves to the token data
 */
const getToken = async (tokenId: number): Promise<Token> => {
  const response = await fetch(`/api/tokens/${tokenId}`);
  if (!response.ok) {
    throw data(`Failed to fetch token with token id ${tokenId}`, { status: response.status });
  }
  return response.json();
};

/**
 * Fetches logs associated with a token by its ID from the API.
 *
 * @param tokenId - The ID of the token to fetch logs for
 * @returns Promise that resolves to an array of log entries
 */
const getLogs = async (tokenId: number): Promise<Log[]> => {
  const response = await fetch(`/api/tokens/${tokenId}/logs`);
  if (!response.ok) {
    throw data(`Failed to fetch logs related to token with token id ${tokenId}`, { status: response.status });
  }
  return response.json();
};

/**
 * Client loader that fetches token and logs data for the details page.
 *
 * @param params - Route parameters containing the token ID
 * @returns Object with token data and logs promise
 */
export const clientLoader = async ({ params }: Route.ClientLoaderArgs): Promise<{ token: Token; logs: Promise<Log[]> }> => {
  // Normally we would check that run number is a number...
  const tokenId = parseInt(params.tokenId, 10);

  const logs = getLogs(tokenId);
  const token = await getToken(tokenId);

  return { token, logs };
};

/**
 * Token details page component that displays token information and associated logs.
 *
 * @param props.loaderData.token - The token data
 * @param props.loaderData.logs - Promise that resolves to the logs array
 */
export default function Details({ loaderData: { token, logs } }: Route.ComponentProps) {

  const { tokenId, last4chars, issuer, iat, serviceFrom, serviceTo, exp } = token;
  const expirationDate = exp.split('T').reverse().join(' - ');

  const fields = [
    { label: 'Last 4 token characters', value: last4chars },
    { label: 'Issuer', value: issuer },
    { label: 'Issued at', value: iat },
    { label: 'Subject', value: serviceFrom },
    { label: 'Audience', value: serviceTo },
    { label: 'Expires at', value: expirationDate },
  ];

  return <>
    <h1>Token {tokenId} details</h1>
    {fields.map((f) => (
      <p key={f.label}>
        {f.label}: <strong>{f.value ?? '—'}</strong>
      </p>
    ))}
    <h2>Logs</h2>
    <Suspense fallback={<Spinner size={2} align={'left'} />}>
      <Await resolve={logs} errorElement={<div><em>Failed to load the logs</em></div>}>
        {(logs) => <TokenLogs logs={logs} />}
      </Await>
    </Suspense>
    <Link to={'/tokens'}>Back to overview</Link>
  </>;
}
