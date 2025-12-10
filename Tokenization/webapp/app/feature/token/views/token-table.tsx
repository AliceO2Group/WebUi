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

import { useEffect, useState } from 'react';

import { Box1_2 } from '~/ui/box';
import type { Token } from '~/feature/token/types/token';
import { TokenTableExtended } from '~/feature/token/components/token-table';
import { TokenFilters } from '~/feature/token/components/token-filters';
import { TokenFiltersProvider } from '~/feature/token/contexts/token-filters';

/**
 * Tokens table route showing full filters + grid driven by TanStack Query data.
 */
export default function TokenTableRouteiew({ tokens }: { tokens: Token[] }) {
  const [filtered, setFiltered] = useState<boolean>(false); // To check if there is any filter applied
  const [data, setData] = useState<Token[]>(tokens);
  useEffect(() => {
    setData(tokens);
  }, [tokens]);

  return <TokenFiltersProvider>
    <Box1_2 link={null}>
      <div className="mv2"></div>
      <TokenFilters setFiltered={setFiltered} setData={setData} />
      <TokenTableExtended tokens={data} setTokens={setData} filtered={filtered} />
    </Box1_2>
  </TokenFiltersProvider>;
}
