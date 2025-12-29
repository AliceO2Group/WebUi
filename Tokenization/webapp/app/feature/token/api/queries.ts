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

import { fetchAvailableServices } from '~/feature/token/services/service-options.service';
import { fetchTokenById, fetchTokenLogs, fetchTokens } from '~/feature/token/services/tokens.service';
import type { TokenStatus } from '~/feature/token/types/token';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';
import { useSession } from '~/feature/auth/hooks/session';

const tokenListsKey = ['tokens', 'list'] as const;

export const tokenQueryKeys = {
  list: (filters: TokenFilterValues | null, status?: TokenStatus) => [...tokenListsKey, status ?? 'all', filters] as const,
  serviceOptionsSearch: (term: string) => ['tokens', 'service-options', term] as const,
  detail: (tokenId: string) => ['tokens', 'detail', tokenId] as const,
  logs: (tokenId: string) => ['tokens', 'detail', tokenId, 'logs'] as const,
};

type UseServiceOptionsParams = {
  enabled?: boolean;
  searchTerm?: string;
};

/**
 * Fetches the list of services available for token filters.
 */
export function useTokenServiceOptionsQuery(params?: UseServiceOptionsParams) {
  const { token } = useSession();

  const searchTerm = params?.searchTerm ?? '';
  return useQuery({
    queryKey: tokenQueryKeys.serviceOptionsSearch(searchTerm),
    queryFn: () => fetchAvailableServices(searchTerm, token),
    enabled: params?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
}

type UseTokensQueryParams = {
  filters: TokenFilterValues | null;
  enabled?: boolean;
  status?: TokenStatus;
};

/**
 * Fetches tokens matching the provided filters, returning potential errors
 */
export function useTokensQuery({ filters, enabled = true, status }: UseTokensQueryParams) {
  const { token } = useSession();

  return useQuery({
    queryKey: tokenQueryKeys.list(filters, status),
    enabled,
    queryFn: () => fetchTokens(filters, status, token),
  });
}

type UseTokenDetailsQueryParams = {
  tokenId: string | undefined;
  enabled?: boolean;
};

/**
 * Fetches the full details of a single token.
 */
export function useTokenDetailsQuery({ tokenId, enabled = true }: UseTokenDetailsQueryParams) {
  const { token } = useSession();

  return useQuery({
    queryKey: tokenQueryKeys.detail(tokenId ?? ''),
    enabled: Boolean(tokenId) && enabled,
    queryFn: () => fetchTokenById(tokenId as string, token),
  });
}

type UseTokenLogsQueryParams = {
  tokenId: string | undefined;
  enabled?: boolean;
};

/**
 * Fetches the logs associated with a specific token.
 */
export function useTokenLogsQuery({ tokenId, enabled = true }: UseTokenLogsQueryParams) {
  const { token } = useSession();

  return useQuery({
    queryKey: tokenQueryKeys.logs(tokenId ?? ''),
    enabled: Boolean(tokenId) && enabled,
    queryFn: () => fetchTokenLogs(tokenId as string, token),
  });
}
