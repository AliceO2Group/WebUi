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

import { Box1_2 } from '~/ui/box';
import { TokenTable } from '../components/token-table';
import { useEffect, useState } from 'react';

/**
 * High-level tokens overview page combining the table preview and create shortcut.
 */
export default function TokenOverviewView({ tokens }: { tokens: Token[] }) {
  const [data, setData] = useState<Token[]>(tokens);
  useEffect(() => {
    setData(tokens);
  }, [tokens]);

  return (
    <div className="grid-1-2">
      <Box1_2 link="/tokens/table">
        <TokenTable tokens={data} setTokens={setData} />
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
