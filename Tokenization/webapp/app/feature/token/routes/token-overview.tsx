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
import type { Token } from '../types/token';

import { useLoaderData } from 'react-router';
import TokenOverviewView from '../views/token-overview';
import { tokensMock } from '../mocks/tokens';

/**
 * Client loader that fetches all tokens from the API.
 *
 * @returns Promise that resolves to an array of tokens
 */
export const clientLoader = async (): Promise<{ tokens: Promise<Token[]> }> => {
  const tokens = new Promise<Token[]>((resolve) => {
    setTimeout(() => {
      resolve(Array.from(tokensMock.values()) as unknown as Token[]);
    }, 500);
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
  const { tokens } = useLoaderData();
  return <TokenOverviewView tokens={tokens} />;
}
