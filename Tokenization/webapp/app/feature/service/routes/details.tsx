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

import { useParams } from 'react-router';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

import { useServiceDetailsQuery } from '~/feature/service/api/queries';
import { useTokensQuery } from '~/feature/token/api/queries';
import { useRevokeActions } from '~/feature/token/hooks/useRevokeActions';
import { TOKEN_FILTER_DEFAULTS, type TokenFilterValues } from '~/feature/token/types/token-filters';
import type { Service } from '../types/service';
import ServiceTokensSection from '../components/service-tokens-table';
import { Spinner } from '~/ui/spinner';
import ServiceInfo from '../components/service-info';

/**
 * Route component to display details of a specific service.
 * Shows service information and lists of tokens issued from and targeting the service.
 */
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
        <Spinner />
      </Centered>
    );
  }

  if (serviceQuery.isError) {
    return <Alert severity="error">Failed to load service details.</Alert>;
  }

  if (!serviceQuery.data) {
    return <Alert severity="warning">Service not found.</Alert>;
  }

  return (
    <Stack spacing={3}>
      <ServiceInfo service={service} />
      <Stack sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
        <ServiceTokensSection
          title="Tokens issued from this service"
          query={outgoingTokensQuery}
          filters={outgoingFilters}
          onRevoke={confirmRevokeOutgoing}
          onBulkRevoke={() => outgoingFilters && confirmBulkRevokeOutgoing(outgoingFilters)}
        />
        <ServiceTokensSection
          title="Tokens targeting this service"
          query={incomingTokensQuery}
          filters={incomingFilters}
          onRevoke={confirmRevokeIncoming}
          onBulkRevoke={() => incomingFilters && confirmBulkRevokeIncoming(incomingFilters)}
        />
      </Stack>
    </Stack>
  );
}

const Centered = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
  width: '100%',
}));

/**
 * Builds token filter values for a service based on the specified direction.
 *
 * @param service The service to build filters for.
 * @param direction 'from' to filter tokens issued from the service, 'to' for tokens targeting the service.
 * @returns TokenFilterValues object with the appropriate service filter set.
 */
function buildServiceFilter(service: Service | undefined, direction: 'from' | 'to'): TokenFilterValues {
  if (!service) {
    return TOKEN_FILTER_DEFAULTS;
  }

  return {
    ...TOKEN_FILTER_DEFAULTS,
    serviceFrom: direction === 'from' ? [{ value: service.serviceId, label: service.commonName }] : [],
    serviceTo: direction === 'to' ? [{ value: service.serviceId, label: service.commonName }] : [],
  };
}
