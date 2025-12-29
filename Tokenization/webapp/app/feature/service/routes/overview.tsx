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

import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { ServiceFiltersForm } from '~/feature/service/components/service-filters-form';
import { ServicesTable } from '~/feature/service/components/service-table';
import { useServicesQuery } from '~/feature/service/api/queries';
import type { ServiceFilterValues } from '~/feature/service/types/service-filters';
import { useFiltersPanel } from '~/shared/hooks/useFiltersPanel';

/**
 * Services overview lists registered services with date filters and ordering.
 */
export default function ServicesOverviewRoute() {
  const {
    filtersOpen,
    toggleFiltersPanel,
    appliedFilters,
    handleFiltersChange,
  } = useFiltersPanel<ServiceFilterValues>({ initiallyOpen: false });

  const servicesQuery = useServicesQuery({
    filters: appliedFilters,
  });

  const services = servicesQuery.data?.services ?? [];
  const totalCount = servicesQuery.data?.totalCount ?? services.length;

  return (
    <Stack spacing={3}>
      <FiltersCard elevation={0}>
        <FiltersHeader>
          <Typography variant="h6">Filters</Typography>
          <Button size="small" variant="text" onClick={toggleFiltersPanel}>
            {filtersOpen ? 'Hide' : 'Show'}
          </Button>
        </FiltersHeader>
        <Collapse in={filtersOpen} timeout="auto">
          <FiltersBody>
            <ServiceFiltersForm onFiltersChange={handleFiltersChange} />
          </FiltersBody>
        </Collapse>
      </FiltersCard>

      <ServicesTable services={services} totalCount={totalCount} isLoading={servicesQuery.isLoading} />
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
