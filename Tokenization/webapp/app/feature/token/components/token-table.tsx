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
import { Link } from 'react-router';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import { DataTable, type DataTableColumn } from '~/shared/components/data-table';
import type { Token } from '~/feature/token/types/token';

type TokensTableProps = {
  tokens: Token[];
  totalCount: number;
  onRevoke?: (token: Token) => void;
};

export function TokensTable({ tokens, totalCount, onRevoke }: TokensTableProps) {
  const columns: Array<DataTableColumn<Token>> = useMemo(() => [
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
      render: (token) => `${token.serviceFrom} → ${token.serviceTo}`,
    },
    {
      key: 'issuer',
      header: 'Issuer',
      render: (token) => token.issuer,
    },
    {
      key: 'exp',
      header: 'Expires',
      render: (token) => new Date(token.exp).toLocaleString(),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      render: (token) => (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {token.permissions.map((permission) => (
            <Chip key={permission} size="small" label={permission} color="primary" variant="outlined" />
          ))}
        </Stack>
      ),
    },
    {
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
    },
  ], [onRevoke]);

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <BoxedTitle current={tokens.length} total={totalCount} />
      </Stack>
      <DataTable columns={columns} rows={tokens} getRowKey={(token) => token.tokenId} dense />
    </Paper>
  );
}

type BoxedTitleProps = {
  current: number;
  total: number;
};

const BoxedTitle = ({ current, total }: BoxedTitleProps) => (
  <Stack>
    <Typography variant="h6">Issued tokens</Typography>
    <Typography variant="body2" color="text.secondary">
      Showing {current} of {total} items
    </Typography>
  </Stack>
);
