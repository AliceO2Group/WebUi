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

import { useBanServiceRouteMutation, useBulkBanServiceRoutesMutation } from '~/feature/service-routes/api/mutations';
import type { ServiceRoute } from '~/feature/service-routes/types/service-route';
import type { ServiceRouteFilterValues } from '~/feature/service-routes/types/service-route-filters';
import { useAuth } from '~/feature/auth/hooks/session';
import useModal from '~/shared/hooks/useModal';
import { useAlert } from '~/shared/hooks/useAlert';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';
import { validateRouteFiltersForBulk } from '~/feature/service-routes/services/service-route-filters.service';

/**
 * Hook providing actions to confirm banning of service routes, both single and bulk.
 * Utilizes modals for user confirmation and alerts for feedback.
 *
 * @returns An object containing confirmBan and confirmBulkBan functions.
 */
export function useRouteBanActions() {
  const hasAuth = useAuth();
  const pushAlert = useAlert();
  const { showModal } = useModal();
  const banRouteMutation = useBanServiceRouteMutation();
  const bulkBanMutation = useBulkBanServiceRoutesMutation();

  const confirmBan = useCallback((route: ServiceRoute) => {
    showModal({
      title: 'Ban service route',
      content: (
        <Stack spacing={1}>
          <Typography variant="body2">
            Do you want to ban communication from
            <strong>{route.serviceFrom.commonName}</strong> to <strong>{route.serviceTo.commonName}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Permissions: {route.permissions.join(', ')}
          </Typography>
          <Typography variant="body2" color="warning.main">
            Banning this route revokes every token operating on it.
          </Typography>
        </Stack>
      ),
      accent: 'danger',
      confirmLabel: 'Ban',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        if (!hasAuth) {
          pushAlert(AUTH_ERROR_ALERT);
          return;
        }
        banRouteMutation.mutate(route.routeId, {
          onSuccess: () => {
            pushAlert({ message: 'Route banned successfully.', severity: 'success' });
          },
          onError: (_error) => {
            pushAlert({ message: 'Failed to ban route.', severity: 'error' });
          },
        });
      },
    });
  }, [banRouteMutation, hasAuth, pushAlert, showModal]);

  const confirmBulkBan = useCallback((filters: ServiceRouteFilterValues) => {
    showModal({
      title: 'Bulk ban service routes',
      content: (
        <Stack spacing={1}>
          <Typography variant="body2">
            This will ban all routes that match the current filters.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Filters summary: {JSON.stringify(filters)}
          </Typography>
          <Typography variant="body2" color="warning.main">
            Each banned route revokes all tokens that belong to it.
          </Typography>
        </Stack>
      ),
      accent: 'danger',
      confirmLabel: 'Ban all',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        if (!hasAuth) {
          pushAlert(AUTH_ERROR_ALERT);
          return;
        }
        const validationErr = validateRouteFiltersForBulk(filters);
        if (validationErr) {
          pushAlert({ message: validationErr, severity: 'warning' });
          return;
        }
        bulkBanMutation.mutate(filters, {
          onSuccess: () => {
            pushAlert({ message: 'Routes banned successfully.', severity: 'success' });
          },
          onError: (_error) => {
            pushAlert({ message: 'Failed to ban routes.', severity: 'error' });
          },
        });
      },
    });
  }, [bulkBanMutation, hasAuth, pushAlert, showModal]);

  return {
    confirmBan,
    confirmBulkBan,
  };
}
