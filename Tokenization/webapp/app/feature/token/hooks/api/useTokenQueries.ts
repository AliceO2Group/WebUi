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

import { useQuery } from '@tanstack/react-query';

import { useFetchClient } from '~/utils/fetcher';
import {
  getToken,
  getTokenLogs,
  getTokenServices,
  getTokens,
} from '../../services/tokenApi';

const tokenQueries = {
  all: ['tokens'] as const,
  list: () => ['tokens', 'list'] as const,
  details: (tokenId: string) => ['tokens', tokenId] as const,
  logs: (tokenId: string) => ['tokens', tokenId, 'logs'] as const,
  services: () => ['tokens', 'services'] as const,
};

export function useTokenQueries() {
  const fetchClient = useFetchClient();

  const list = () => useQuery({
    queryKey: tokenQueries.list(),
    queryFn: () => getTokens(fetchClient),
  });

  const details = (tokenId: string) => useQuery({
    queryKey: tokenQueries.details(tokenId),
    queryFn: () => getToken(fetchClient, tokenId),
    enabled: Boolean(tokenId),
  });

  const logs = (tokenId: string) => useQuery({
    queryKey: tokenQueries.logs(tokenId),
    queryFn: () => getTokenLogs(fetchClient, tokenId),
    enabled: Boolean(tokenId),
  });

  const services = () => useQuery({
    queryKey: tokenQueries.services(),
    queryFn: () => getTokenServices(fetchClient),
  });

  return {
    list,
    details,
    logs,
    services,
  } as const;
}

export const tokenQueryKeys = tokenQueries;
