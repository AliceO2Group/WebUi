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

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { revokeToken, revokeTokensBulk } from '~/feature/token/services/tokens.service';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';
import { useSession } from '~/feature/auth/hooks/session';

/**
 * Triggers revocation of a single token and refreshes cached lists afterwards.
 */
export function useRevokeTokenMutation() {
  const { token } = useSession();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tokenId: string) => revokeToken(tokenId, token),
    onSuccess: () => {
      queryClient.invalidateQueries(
        { predicate: ({ queryKey }) =>
          Array.isArray(queryKey) && queryKey[0] === 'tokens' && queryKey.includes('logs'),
        },
      );
    },
  });
}

/**
 * Triggers revocation of all tokens matching the provided filters.
 */
export function useBulkRevokeMutation() {
  const { token } = useSession();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (filters: TokenFilterValues) => revokeTokensBulk(filters, token),
    onSuccess: () => {
      queryClient.invalidateQueries(
        { predicate: ({ queryKey }) =>
          Array.isArray(queryKey) && queryKey[0] === 'tokens' && queryKey.includes('logs'),
        },
      );
    },
  });
}
