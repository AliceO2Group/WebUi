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
import TokenTableRouteView from '../views/token-table';
import { tokensMock } from '../mocks/tokens';

//eslint-disable-next-line jsdoc/require-jsdoc
export async function clientLoader() {
  const tokens = new Promise<Token[]>((resolve) => {
    setTimeout(() => {
      resolve(Array.from(tokensMock.values()) as unknown as Token[]);
    }, 500);
  });
  return { tokens };
}

//eslint-disable-next-line jsdoc/require-jsdoc
export default function TokensTable() {
  const { tokens } = useLoaderData();
  return <TokenTableRouteView tokens={tokens} />;

}
