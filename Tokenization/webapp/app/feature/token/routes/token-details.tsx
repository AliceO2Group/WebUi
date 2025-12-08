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
import type { Route } from './+types/token-details';

import { useLoaderData } from 'react-router';

import type { Token } from '../types/token';
import type { Log } from '~/feature/token/types/log';

import TokenDetailsView from '../views/token-details';
import { tokensMock } from '../mocks/tokens';
import { logsMock } from '../mocks/logs';
/**
 * Fetches a token by its ID from the API.
 *
 * @param tokenId - The ID of the token to fetch
 * @returns Promise that resolves to the token data
 */
const getToken = async (tokenId: number): Promise<Token> => new Promise((resolve, reject) => {
  setTimeout(() => {
    const t = tokensMock.get(tokenId);
    if (!t) {
      reject(new Error(`Token with ID ${tokenId} not found`));
      return;
    }
    resolve({ ...(t as any), id: String((t as any).id) } as Token);
  }, 500);
});

/**
 * Fetches logs associated with a token by its ID from the API.
 *
 * @param tokenId - The ID of the token to fetch logs for
 * @returns Promise that resolves to an array of log entries
 */
const getLogs = async (tokenId: number): Promise<Log[]> => new Promise((resolve) => {
  setTimeout(() => {
    const logs = logsMock.get(tokenId) ?? [];
    resolve(logs);
  }, 500);
});

/**
 * Client loader that fetches token and logs data for the details page.
 * @returns Object with token data and logs promise
 */
export const clientLoader = async ({ params }: Route.ClientLoaderArgs): Promise<{ token: Token; logs: Promise<Log[]> }> => {
  // Normally we would check that run number is a number...
  const tokenId = parseInt(params.tokenId, 10);
  let logs; let token;
  try {
    logs = getLogs(tokenId);
    token = await getToken(tokenId);
  } catch (error) {
    throw new Response((error as Error).message, { status: 404 });
  }
  return { token, logs };
};

/**
 * Token details page component that displays token information and associated logs.
 *
 * @param props.loaderData.token - The token data
 * @param props.loaderData.logs - Promise that resolves to the logs array
 */
export default function Details() {
  const loaderData = useLoaderData();
  return <TokenDetailsView {...loaderData} />;
}
