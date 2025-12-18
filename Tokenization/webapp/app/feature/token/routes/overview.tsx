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
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { useTokensQuery } from '~/feature/token/api/queries';
import { TokenFiltersForm } from '~/feature/token/components/token-filters-form';
import { TokensTable } from '~/feature/token/components/token-table';
import { useRevokeActions } from '~/feature/token/hooks/useRevokeActions';
import { useTokenFiltersPanel } from '~/feature/token/hooks/useTokenFiltersPanel';
import { hasDataFilters } from '~/feature/token/services/token-filters.service';
import type { Token } from '~/feature/token/types/token';

/**
 *
 */
export default function TokensOverviewRoute() {
  const {
    filtersOpen,
    toggleFiltersPanel,
    appliedFilters,
    handleFiltersChange,
  } = useTokenFiltersPanel();
  
  const tokensQuery = useTokensQuery({
    filters: appliedFilters,
    status: 'active',
  });
  const { confirmRevoke, confirmBulkRevoke } = useRevokeActions(appliedFilters);

  const tokensData = tokensQuery.data?.tokens ?? [];
  const canBulkRevoke = Boolean(appliedFilters && hasDataFilters(appliedFilters));

  const handleRevoke = useCallback((token: Token) => {
    confirmRevoke(token);
  }, [confirmRevoke]);

  const handleBulkRevoke = useCallback(() => {
    if (!canBulkRevoke || !appliedFilters) {
      return;
    }
    confirmBulkRevoke(appliedFilters);
  }, [canBulkRevoke, appliedFilters, confirmBulkRevoke]);

  return (
    <Stack spacing={3}>
      <FiltersCard elevation={0}>
        <FiltersHeader>
          <Typography variant="h6">Filters</Typography>
          <Button size="small" variant="text" onClick={toggleFiltersPanel}>
            {filtersOpen ? 'Hide' : 'Show'}
          </Button>
        </FiltersHeader>
        {filtersOpen ? (
          <FiltersBody>
            <TokenFiltersForm
              onFiltersChange={handleFiltersChange}
            />
          </FiltersBody>
        ) : null}
      </FiltersCard>

      <TokensTable
        tokens={tokensData}
        totalCount={tokensData.length}
        onRevoke={handleRevoke}
        onBulkRevoke={handleBulkRevoke}
        bulkRevokeDisabled={!canBulkRevoke}
        isLoading={tokensQuery.isLoading}
      />
    </Stack>
  );
}

const FiltersCard = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  boxShadow: 'none',
}));

const FiltersHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(2),
}));

const FiltersBody = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(2),
}));
