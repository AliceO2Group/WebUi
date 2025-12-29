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

import type { UseQueryResult } from '@tanstack/react-query';
import Box from '@mui/material/Box';

import { TokensTable } from '~/feature/token/components/token-table';;
import type { TokensQueryResponse } from '~/feature/token/services/tokens.service';
import type { Token } from '~/feature/token/types/token';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';

const TOKEN_TABLE_HEIGHT = 320;

type ServiceTokensSectionProps = {
  title: string;
  query: UseQueryResult<TokensQueryResponse, unknown>;
  filters: TokenFilterValues | null;
  onRevoke: (token: Token) => void;
  onBulkRevoke?: () => void;
  tableBodyMaxHeight?: number | string;
};

/**
 *
 */
export default function ServiceTokensSection({ title,
  query,
  filters,
  onRevoke,
  onBulkRevoke,
  tableBodyMaxHeight = TOKEN_TABLE_HEIGHT,
}: ServiceTokensSectionProps) {

  const tokens = query.data?.tokens ?? [];
  const bulkDisabled = !filters || tokens.length === 0;

  const handleBulkRevoke = () => {
    if (bulkDisabled || !onBulkRevoke) {
      return;
    }
    onBulkRevoke();
  };

  return (
    <Box sx={{ width: '49.5%', minWidth: 700 }}>
      <TokensTable
        tokens={tokens}
        totalCount={tokens.length}
        title={title}
        onRevoke={onRevoke}
        onBulkRevoke={onBulkRevoke ? handleBulkRevoke : undefined}
        bulkRevokeDisabled={bulkDisabled}
        tableBodyMaxHeight={tableBodyMaxHeight}
        isLoading={query.isLoading}
      />
    </Box>
  );

}
