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

import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import type { UseQueryResult } from '@tanstack/react-query';

import { useServiceDetailsQuery } from '~/feature/service/api/queries';
import { useTokensQuery } from '~/feature/token/api/queries';
import { TokensTable } from '~/feature/token/components/token-table';
import { useRevokeActions } from '~/feature/token/hooks/useRevokeActions';
import type { TokensQueryResponse } from '~/feature/token/services/tokens.service';
import type { Token } from '~/feature/token/types/token';
import { TOKEN_FILTER_DEFAULTS, type TokenFilterValues } from '~/feature/token/types/token-filters';
import type { Service } from '../types/service';

const TOKEN_TABLE_HEIGHT = 320;

export default function ServiceDetailsRoute() {
	const { serviceId } = useParams<{ serviceId: string }>();
	const hasServiceId = Boolean(serviceId);

	const serviceQuery = useServiceDetailsQuery({ serviceId: serviceId ?? '', enabled: hasServiceId });
	const service = serviceQuery.data;

	const outgoingFilters = serviceId ? buildServiceFilter(service, 'from') : null;
	const incomingFilters = serviceId ? buildServiceFilter(service, 'to') : null;

	const { confirmRevoke: confirmRevokeOutgoing, confirmBulkRevoke: confirmBulkRevokeOutgoing } = useRevokeActions(outgoingFilters);
	const { confirmRevoke: confirmRevokeIncoming, confirmBulkRevoke: confirmBulkRevokeIncoming } = useRevokeActions(incomingFilters);
 
	const outgoingTokensQuery = useTokensQuery({
		filters: outgoingFilters,
		status: 'active',
		enabled: outgoingFilters !== TOKEN_FILTER_DEFAULTS,
	});

	const incomingTokensQuery = useTokensQuery({
		filters: incomingFilters,
		status: 'active',
		enabled: incomingFilters !== TOKEN_FILTER_DEFAULTS,
	});

	if (!hasServiceId) {
		return <Alert severity="error">Missing service identifier.</Alert>;
	}

	if (serviceQuery.isLoading) {
		return (
			<Centered>
				<CircularProgress />
			</Centered>
		);
	}

	if (serviceQuery.isError) {
		return <Alert severity="error">Failed to load service details.</Alert>;
	}

	if (!serviceQuery.data) {
		return <Alert severity="warning">Service not found.</Alert>;
	}

	const renewPath = `/services/${serviceId}/renew`;

	return (
		<Stack spacing={3}>
			<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
				<Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={2}>
					<Typography variant="h5">Service certificate</Typography>
					<Button component={Link} to={renewPath} variant="contained">
						Renew certificate
					</Button>
				</Stack>
				<Divider sx={{ my: 2 }} />
				<DetailsGrid>
					<InfoItem label="Service ID" value={service?.serviceId ?? ''} />
					<InfoItem label="Common name" value={service?.commonName ?? ''} />
					<InfoItem label="Issued at" value={new Date(service?.iat ?? '').toLocaleString()} />
					<InfoItem label="Expires" value={new Date(service?.exp ?? '').toLocaleString()} />
				</DetailsGrid>
			</Paper>

			<Stack spacing={3}>
				<ServiceTokensSection
					title="Tokens issued from this service"
					query={outgoingTokensQuery}
					filters={outgoingFilters}
					onRevoke={confirmRevokeOutgoing}
					onBulkRevoke={() => outgoingFilters && confirmBulkRevokeOutgoing(outgoingFilters)}
					tableBodyMaxHeight={TOKEN_TABLE_HEIGHT}
				/>
				<ServiceTokensSection
					title="Tokens targeting this service"
					query={incomingTokensQuery}
					filters={incomingFilters}
					onRevoke={confirmRevokeIncoming}
					onBulkRevoke={() => incomingFilters && confirmBulkRevokeIncoming(incomingFilters)}
					tableBodyMaxHeight={TOKEN_TABLE_HEIGHT}
				/>
			</Stack>
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

type ServiceTokensSectionProps = {
	title: string;
	query: UseQueryResult<TokensQueryResponse, unknown>;
	filters: TokenFilterValues | null;
	onRevoke: (token: Token) => void;
	onBulkRevoke?: () => void;
	tableBodyMaxHeight?: number | string;
};

function ServiceTokensSection({ title, query, filters, onRevoke, onBulkRevoke, tableBodyMaxHeight = TOKEN_TABLE_HEIGHT }: ServiceTokensSectionProps) {
	if (query.isLoading) {
		return <TableLoader title={title} />;
	}

	if (query.isError) {
		return <Alert severity="error">Failed to load {title.toLowerCase()}.</Alert>;
	}

	const tokens = query.data?.tokens ?? [];
	const bulkDisabled = !filters || tokens.length === 0;

	const handleBulkRevoke = () => {
		if (bulkDisabled || !onBulkRevoke) {
			return;
		}
		onBulkRevoke();
	};

	return (
		<TokensTable
			tokens={tokens}
			totalCount={tokens.length}
			title={title}
			onRevoke={onRevoke}
			onBulkRevoke={onBulkRevoke ? handleBulkRevoke : undefined}
			bulkRevokeDisabled={bulkDisabled}
			tableBodyMaxHeight={tableBodyMaxHeight}
		/>
	);
}

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

const TableLoader = ({ title }: { title: string }) => (
	<Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', p: 3 }}>
		<Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
			<Typography variant="h6">{title}</Typography>
			<Typography variant="body2" color="text.secondary">
				Loading data...
			</Typography>
		</Stack>
		<Stack alignItems="center" justifyContent="center" py={4}>
			<CircularProgress size={24} />
		</Stack>
	</Paper>
);

function buildServiceFilter(service: Service | undefined, direction: 'from' | 'to'): TokenFilterValues {
	if(!service) {
		return TOKEN_FILTER_DEFAULTS
	}
	
	return {
		...TOKEN_FILTER_DEFAULTS,
		serviceFrom: direction === 'from' ? [{value: service.serviceId, label: service.commonName}] : [],
		serviceTo: direction === 'to' ? [{value: service.serviceId, label: service.commonName}] : [],
	};
}
