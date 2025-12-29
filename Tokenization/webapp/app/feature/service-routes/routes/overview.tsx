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
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { ServiceRouteFiltersForm } from '~/feature/service-routes/components/service-route-filters-form';
import { ServiceRouteTable } from '~/feature/service-routes/components/service-route-table';
import { ServiceRouteRegisterForm } from '~/feature/service-routes/components/service-route-register-form';
import { useServiceRoutesQuery } from '~/feature/service-routes/api/queries';
import { useRouteBanActions } from '~/feature/service-routes/hooks/useRouteBanActions';
import { hasRouteFilters } from '~/feature/service-routes/services/service-route-filters.service';
import type { ServiceRoute } from '../types/service-route';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { useFiltersPanel } from '~/shared/hooks/useFiltersPanel';

/**
 *
 */
export default function ServiceRoutesOverviewRoute() {
  const {
    filtersOpen,
    toggleFiltersPanel,
    appliedFilters,
    handleFiltersChange,
  } = useFiltersPanel<ServiceRouteFilterValues>();

  const routesQuery = useServiceRoutesQuery({ filters: appliedFilters });
  const { confirmBan, confirmBulkBan } = useRouteBanActions();

  const routes = routesQuery.data?.routes ?? [];
  const totalCount = routesQuery.data?.totalCount ?? routes.length;
  const canBulkBan = Boolean(appliedFilters && hasRouteFilters(appliedFilters));

  const handleBan = useCallback((route: ServiceRoute) => {
    confirmBan(route);
  }, [confirmBan]);

  const handleBulkBan = useCallback(() => {
    if (!canBulkBan || !appliedFilters) {
      return;
    }
    confirmBulkBan(appliedFilters);
  }, [appliedFilters, canBulkBan, confirmBulkBan]);

  return (
    <OverviewLayout>
      <ServiceRouteRegisterForm />

      <RightColumn spacing={0}>
        <SectionCard elevation={0}>
          <FiltersHeader>
            <Typography variant="h6">Filters</Typography>
            <Button size="small" variant="text" onClick={toggleFiltersPanel}>
              {filtersOpen ? 'Hide filters' : 'Show filters'}
            </Button>
          </FiltersHeader>
          <Collapse in={filtersOpen} timeout="auto">
            <FiltersBody>
              <ServiceRouteFiltersForm onFiltersChange={handleFiltersChange} />
            </FiltersBody>
          </Collapse>
        </SectionCard>

        <TableSection>
          <ServiceRouteTable
            routes={routes}
            totalCount={totalCount}
            onBan={handleBan}
            onBulkBan={handleBulkBan}
            bulkBanDisabled={!canBulkBan}
            isLoading={routesQuery.isLoading}
          />
        </TableSection>
      </RightColumn>
    </OverviewLayout>
  );
}

const OverviewLayout = styled('div')(({ theme }) => ({
  display: 'grid',
  gap: theme.spacing(3),
  gridTemplateColumns: '1fr',
  alignItems: 'stretch',
  [theme.breakpoints.up('lg')]: {
    gridTemplateColumns: 'minmax(320px, 0.9fr) minmax(0, 1.6fr)',
    alignItems: 'start',
  },
}));

const SectionCard = styled(Paper)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(2),
  boxShadow: 'none',
}));

const RightColumn = styled(Stack)(({ theme }) => ({
  width: '100%',
  gap: theme.spacing(3),
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

const TableSection = styled('div')(({ theme }) => ({
  marginTop: theme.spacing(3),
}));
