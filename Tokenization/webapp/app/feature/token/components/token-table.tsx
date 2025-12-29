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

/**
 * TokensTable renders a Material UI paper that wraps the reusable DataTable
 * and exposes convenient props for row actions such as revoke.
 */
import { useMemo } from 'react';
import { Link } from 'react-router';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DataTable, type DataTableColumn } from '~/shared/components/data-table';
import type { Token } from '~/feature/token/types/token';

type TokensTableProps = {
  tokens: Token[];
  totalCount: number;
  title?: string;
  onRevoke?: (token: Token) => void;
  onBulkRevoke?: () => void;
  bulkRevokeDisabled?: boolean;
  tableBodyMaxHeight?: number | string;
  isLoading?: boolean;
};

/**
 *
 */
export function TokensTable({ tokens, totalCount, title = 'Active tokens', onRevoke, onBulkRevoke, bulkRevokeDisabled = false, tableBodyMaxHeight, isLoading }: TokensTableProps) {
  const showActionsColumn = Boolean(onRevoke);
  const showBulkAction = Boolean(onBulkRevoke);

  const columns: Array<DataTableColumn<Token>> = useMemo(() => {
    const baseColumns: Array<DataTableColumn<Token>> = [
      {
        key: 'tokenId',
        header: 'Token ID',
        render: (token) => (
          <Button
            component={Link}
            to={`/tokens/${token.tokenId}`}
            variant="text"
            size="small"
          >
            {token.tokenId}
          </Button>
        ),
      },
      {
        key: 'services',
        header: 'Services',
        render: (token) => (
          <>
            <Link to={`/services/${token.serviceFrom.serviceId}`}>{token.serviceFrom.commonName}</Link>
            →
            <Link to={`/services/${token.serviceTo.serviceId}`}>{token.serviceTo.commonName}</Link>
          </>
        ),
      },
      {
        key: 'iat',
        header: 'Issued at',
        render: (token) => new Date(token.iat).toLocaleString(),
      },
      {
        key: 'exp',
        header: 'Expires',
        render: (token) => new Date(token.exp).toLocaleString(),
      },
    ];

    if (showActionsColumn) {
      baseColumns.push({
        key: 'actions',
        header: 'Actions',
        render: (token) => (
          <Button
            size="small"
            color="warning"
            variant="outlined"
            onClick={() => onRevoke?.(token)}
          >
            Revoke
          </Button>
        ),
        align: 'right',
      });
    }

    return baseColumns;
  }, [showActionsColumn, onRevoke]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
        <BoxedTitle current={tokens.length} total={totalCount} title={title} />
        {showBulkAction ? (
          <Button
            variant="outlined"
            color="warning"
            onClick={onBulkRevoke}
            disabled={bulkRevokeDisabled}
          >
            Bulk revoke
          </Button>
        ) : null}
      </Stack>
      <DataTable
        columns={columns}
        rows={tokens}
        getRowKey={(token) => token.tokenId}
        dense
        bodyMaxHeight={tableBodyMaxHeight}
        isLoading={isLoading}
      />
    </Paper>
  );
}

type BoxedTitleProps = {
  current: number;
  total: number;
  title: string;
};

const BoxedTitle = ({ current, total, title }: BoxedTitleProps) => (
  <Stack>
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary">
      Showing {current} of {total} items
    </Typography>
  </Stack>
);
