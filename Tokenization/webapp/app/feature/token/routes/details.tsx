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

import { useCallback } from 'react';
import { useParams } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useTokenDetailsQuery, useTokenLogsQuery } from '~/feature/token/api/queries';
import { useRevokeActions } from '~/feature/token/hooks/useRevokeActions';
import type { TokenLogEntry } from '~/feature/token/types/token';

export default function TokenDetailsRoute() {
  const { tokenId } = useParams<{ tokenId: string }>();
  const { confirmRevoke } = useRevokeActions();

  const tokenQuery = useTokenDetailsQuery({ tokenId });
  const logsQuery = useTokenLogsQuery({ tokenId });

  const handleRevoke = useCallback(() => {
    if (tokenQuery.data) {
      confirmRevoke(tokenQuery.data);
    }
  }, [confirmRevoke, tokenQuery.data]);

  if (!tokenId) {
    return <Alert severity="error">Missing token identifier.</Alert>;
  }

  if (tokenQuery.isLoading) {
    return (
      <Centered>
        <CircularProgress />
      </Centered>
    );
  }

  if (tokenQuery.isError) {
    return <Alert severity="error">Failed to load token details.</Alert>;
  }

  if (!tokenQuery.data) {
    return <Alert severity="warning">Token not found.</Alert>;
  }

  const token = tokenQuery.data;

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
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
        <DetailsGrid>
          <InfoItem label="Token ID" value={token.tokenId} />
          <InfoItem label="Service from" value={token.serviceFrom} />
          <InfoItem label="Service to" value={token.serviceTo} />
          <InfoItem label="Issued at" value={new Date(token.iat).toLocaleString()} />
          <InfoItem label="Expires" value={new Date(token.exp).toLocaleString()} />
          <InfoItem label="Issuer" value={token.issuer} />
          <InfoItem label="Last 4 chars" value={token.last4chars} />
        </DetailsGrid>
        <Stack spacing={1} mt={3}>
          <Typography variant="subtitle2">Permissions</Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {token.permissions.length ? token.permissions.map((permission) => (
              <Chip key={permission} label={permission} size="small" />
            )) : <Typography variant="body2" color="text.secondary">No permissions assigned.</Typography>}
          </Stack>
        </Stack>
        <Stack spacing={1} mt={3}>
          <Typography variant="subtitle2">Activity log</Typography>
          <LogsTable entries={logsQuery.data ?? []} loading={logsQuery.isLoading} />
        </Stack>
      </Paper>
    </Stack>
  );
}

type InfoItemProps = {
  label: string;
  value: string;
};

const InfoItem = ({ label, value }: InfoItemProps) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Stack>
);

const DetailsGrid = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(2),
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
}));

const Centered = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
  width: '100%',
}));

type LogsTableProps = {
  entries: TokenLogEntry[];
  loading: boolean;
};

const LogsTable = ({ entries, loading }: LogsTableProps) => {
  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Stack>
    );
  }

  if (!entries.length) {
    return <Typography variant="body2" color="text.secondary">No log entries.</Typography>;
  }

  return (
    <LogsContainer>
      {entries.map((entry) => (
        <Stack key={entry.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
          <Typography variant="body2">{entry.message}</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(entry.timestamp).toLocaleString()}
          </Typography>
        </Stack>
      ))}
    </LogsContainer>
  );
};

const LogsContainer = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1.5),
}));
