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
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useQueryClient } from '@tanstack/react-query';

import { useBulkRevokeMutation, useRevokeTokenMutation } from '~/feature/token/api/mutations';
import type { Token } from '~/feature/token/types/token';
import type { TokenFilterValues } from '~/feature/token/types/token-filters';
import { useAuth } from '~/feature/auth/hooks/session';
import useModal from '~/shared/hooks/useModal';
import { useAlert } from '~/shared/hooks/useAlert';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';
import { validateFiltersForBulk } from '~/feature/token/services/token-filters.service';

/**
 * Provides shared revoke helpers reused across overview and details views.
 */
export function useRevokeActions(filters: TokenFilterValues | null) {
  const hasAuth = useAuth();
  const pushAlert = useAlert();
  const { showModal } = useModal();
  const revokeTokenMutation = useRevokeTokenMutation();
  const bulkRevokeMutation = useBulkRevokeMutation();

  const queryClient = useQueryClient();

  const confirmRevoke = useCallback((token: Token) => {
    showModal({
      title: 'Revoke token',
      content: (
        <Typography variant="body2">
          Are you sure you want to revoke token <strong>{token.tokenId}</strong>? This action will terminate communication between services.
        </Typography>
      ),
      accent: 'danger',
      confirmLabel: 'Revoke',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        if (!hasAuth) {
          pushAlert(AUTH_ERROR_ALERT);
          return;
        }
        revokeTokenMutation.mutate(token.tokenId, {
          onSuccess: () => {
            pushAlert({ message: 'Token revoked successfully.', severity: 'success' });
            // Optimistic UI updates
            queryClient.setQueryData(
              ['tokens', 'list', 'active', filters],
              (old: { tokens?: Token[] } | undefined) => {
                if (!old) {
                  return old;
                }
                return {
                  ...old,
                  tokens: old.tokens?.filter(t => t.tokenId !== token.tokenId) ?? [],
                };
              },
            );
            queryClient.setQueryData(
              ['tokens', 'detail', token.tokenId],
              (old: Token | undefined) => {
                if (!old) {
                  return old;
                }
                return {
                  ...old,
                  status: 'not-active',
                };
              },
            );
          },
          onError: (_error) => {
            pushAlert({ message: 'Failed to revoke token.', severity: 'error' });
          },
        });
      },
    });
  }, [hasAuth, pushAlert, revokeTokenMutation, showModal, filters, queryClient]);

  const confirmBulkRevoke = useCallback((filters: TokenFilterValues) => {
    showModal({
      title: 'Bulk revoke tokens',
      content: (
        <Stack spacing={1}>
          <Typography variant="body2">
            This will revoke all tokens matching the currently applied filters. The operation cannot be undone.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filters summary: {JSON.stringify(filters)}
          </Typography>
        </Stack>
      ),
      accent: 'danger',
      confirmLabel: 'Revoke all',
      cancelLabel: 'Cancel',
      onConfirm: async () => {
        if (!hasAuth) {
          pushAlert(AUTH_ERROR_ALERT);
          return;
        }
        const validationErr = validateFiltersForBulk(filters);
        if (validationErr) {
          pushAlert({ message: validationErr, severity: 'warning' });
          return;
        }
        bulkRevokeMutation.mutate(filters, {
          onSuccess: () => {
            pushAlert({ message: 'Tokens revoked successfully.', severity: 'success' });
            queryClient.setQueryData(
              ['tokens', 'list', 'active', filters],
              (old: { tokens?: Token[] } | undefined) => {
                if (!old) {
                  return old;
                }
                return {
                  ...old,
                  tokens: [],
                };
              },
            );
          },
          onError: (_error) => {
            pushAlert({ message: 'Failed to revoke tokens.', severity: 'error' });
          },
        });
      },
    });
  }, [bulkRevokeMutation, hasAuth, pushAlert, showModal, queryClient]);

  return {
    confirmRevoke,
    confirmBulkRevoke,
  };
}
