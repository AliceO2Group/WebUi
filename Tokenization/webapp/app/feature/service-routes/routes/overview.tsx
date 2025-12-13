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

import { ServiceRouteFiltersForm } from '~/feature/service-routes/components/service-route-filters-form';
import { ServiceRouteTable } from '~/feature/service-routes/components/service-route-table';
import { useServiceRoutesQuery } from '~/feature/service-routes/api/queries';
import { useRouteBanActions } from '~/feature/service-routes/hooks/useRouteBanActions';
import { useServiceRouteFiltersPanel } from '~/feature/service-routes/hooks/useServiceRouteFiltersPanel';
import { hasRouteFilters } from '~/feature/service-routes/services/service-route-filters.service';
import type { ServiceRoute } from '../types/service-route';

export default function ServiceRoutesOverviewRoute() {
	const {
		filtersOpen,
		toggleFiltersPanel,
		appliedFilters,
		handleFiltersChange,
	} = useServiceRouteFiltersPanel();

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
						<ServiceRouteFiltersForm onFiltersChange={handleFiltersChange} />
					</FiltersBody>
				) : null}
			</FiltersCard>

			<ServiceRouteTable
				routes={routes}
				totalCount={totalCount}
				onBan={handleBan}
				onBulkBan={handleBulkBan}
				bulkBanDisabled={!canBulkBan}
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
