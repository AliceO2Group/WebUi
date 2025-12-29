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

import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import type { Token } from '../types/token';
import DataGrid from '~/shared/components/data-grid';

/**
 *
 */
export default function TokenInfo({
  token,
  handleRevoke,
}: {
  token: Token;
  handleRevoke: () => void;
}) {

  const info = [
    { label: 'Token ID', value: token.tokenId },
    { label: 'Service from', value: token.serviceFrom.commonName },
    { label: 'Service to', value: token.serviceTo.commonName },
    { label: 'Issued at', value: new Date(token.iat).toLocaleString() },
    { label: 'Expires', value: new Date(token.exp).toLocaleString() },
    { label: 'Issuer', value: token.issuer },
    { label: 'Last 4 chars', value: token.last4chars },
  ];

  return  <>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
      <Typography variant="h5">Token details</Typography>
      <Chip label={token.status === 'active' ? 'Active' : 'Not active'} color={token.status === 'active' ? 'success' : 'default'} variant="filled" />
      {token.status === 'active' ? (
        <Button color="warning" variant="contained" onClick={handleRevoke}>
          Revoke token
        </Button>
      ) : null}
    </Stack>
    <Divider sx={{ my: 2 }} />
    <DataGrid info={info} />
    <Stack spacing={1} mt={3}>
      <Typography variant="subtitle2">Permissions</Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {token.permissions.length ? token.permissions.map((permission) => (
          <Chip key={permission} label={permission} size="small" />
        )) : <Typography variant="body2" color="text.secondary">No permissions assigned.</Typography>}
      </Stack>
    </Stack>
  </>;
}
