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

import { Await } from 'react-router';
import { Suspense } from 'react';

import type { Token } from '../types/token';
import { Spinner } from '~/ui/spinner';
import { Box1_2 } from '~/ui/box';
import { TokenTable } from '../components//token-table';

/**
 *
 */
export default function TokenOverviewView({ tokens }: { tokens: Promise<Token[]> }) {
  return (
    <div className="grid-1-2">
      <Box1_2 link="/tokens/table">
        <Suspense fallback={<Spinner align='center' />}>
          <Await resolve={tokens}>
            {(resolvedTokens: Token[]) => <TokenTable tokens={resolvedTokens}/>}
          </Await>
        </Suspense>
      </Box1_2>

      <Box1_2 link="/tokens/new">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Create Token</h2>
          <p>Form to create a new token will go here.</p>
        </div>
      </Box1_2>
    </div>
  );
}
