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

import { useCallback, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';

import { useRegisterServiceRouteMutation } from '~/feature/service-routes/api/mutations';
import { useRouteServiceOptionsQuery } from '~/feature/service-routes/api/queries';
import { useAuth } from '~/feature/auth/hooks/session';
import { useAlert } from '~/shared/hooks/useAlert';
import useModal from '~/shared/hooks/useModal';
import { useDebouncedValue } from '~/shared/hooks/useDebouncedValue';
import { AUTH_ERROR_ALERT } from '~/ui/alert/constants';
import type { Service } from '~/feature/service/types/service';

import {
  ROUTE_PERMISSION_OPTIONS,
  SERVICE_SELECT_DEBOUNCE_MS,
  SERVICE_SELECT_MIN_SEARCH_CHARS,
  type ServiceOption,
  type ServiceRouteCreationFormValues,
  type ServiceSelectFieldName,
} from './types';

type ServiceSelectInputs = Record<ServiceSelectFieldName, string>;

const ROUTE_CREATION_DEFAULTS: ServiceRouteCreationFormValues = {
  serviceFrom: null,
  serviceTo: null,
  permissions: [],
};

const SERVICE_SELECT_INPUT_DEFAULTS: ServiceSelectInputs = {
  serviceFrom: '',
  serviceTo: '',
};

/**
 * Composes the data fetching, validation, and submission logic for the route form.
 */
export function useServiceRouteRegisterForm() {
  const hasAuth = useAuth();
  const pushAlert = useAlert();
  const { showModal } = useModal();
  const { mutate: registerRoute, isPending: isRegistering } = useRegisterServiceRouteMutation();

  const {
    control,
    handleSubmit,
    reset: resetCreationForm,
    setValue,
    watch,
    formState: { isValid },
  } = useForm<ServiceRouteCreationFormValues>({
    defaultValues: ROUTE_CREATION_DEFAULTS,
    mode: 'onChange',
  });

  const [serviceSelectInputs, setServiceSelectInputs] = useState<ServiceSelectInputs>(() => ({ ...SERVICE_SELECT_INPUT_DEFAULTS }));

  const serviceFromInput = useDebouncedValue(serviceSelectInputs.serviceFrom.trim(), SERVICE_SELECT_DEBOUNCE_MS);
  const serviceToInput = useDebouncedValue(serviceSelectInputs.serviceTo.trim(), SERVICE_SELECT_DEBOUNCE_MS);

  const serviceFromQueryEnabled = serviceFromInput.length >= SERVICE_SELECT_MIN_SEARCH_CHARS;
  const serviceToQueryEnabled = serviceToInput.length >= SERVICE_SELECT_MIN_SEARCH_CHARS;

  const serviceFromOptionsQuery = useRouteServiceOptionsQuery({
    searchTerm: serviceFromInput,
    enabled: serviceFromQueryEnabled,
  });
  const serviceToOptionsQuery = useRouteServiceOptionsQuery({
    searchTerm: serviceToInput,
    enabled: serviceToQueryEnabled,
  });

  const serviceFromValue = watch('serviceFrom');
  const serviceToValue = watch('serviceTo');

  const mapServiceToOption = useCallback((service: Service): ServiceOption => ({
    value: service.serviceId,
    label: service.commonName,
  }), []);

  const serviceFromOptions = useMemo(() => {
    const base = serviceFromQueryEnabled ? (serviceFromOptionsQuery.data ?? []).map(mapServiceToOption) : [];
    if (serviceFromValue && !base.some((option) => option.value === serviceFromValue.value)) {
      return [serviceFromValue, ...base];
    }
    return base;
  }, [mapServiceToOption, serviceFromOptionsQuery.data, serviceFromQueryEnabled, serviceFromValue]);

  const serviceToOptions = useMemo(() => {
    const base = serviceToQueryEnabled ? (serviceToOptionsQuery.data ?? []).map(mapServiceToOption) : [];
    if (serviceToValue && !base.some((option) => option.value === serviceToValue.value)) {
      return [serviceToValue, ...base];
    }
    return base;
  }, [mapServiceToOption, serviceToOptionsQuery.data, serviceToQueryEnabled, serviceToValue]);

  const handleServiceInputChange = useCallback((field: ServiceSelectFieldName, value: string) => {
    setServiceSelectInputs((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleResetCreationForm = useCallback(() => {
    resetCreationForm(ROUTE_CREATION_DEFAULTS);
    setServiceSelectInputs({ ...SERVICE_SELECT_INPUT_DEFAULTS });
  }, [resetCreationForm]);

  const handleSwapServices = useCallback(() => {
    setValue('serviceFrom', serviceToValue);
    setValue('serviceTo', serviceFromValue);
    setServiceSelectInputs({
      serviceFrom: serviceToValue?.label ?? '',
      serviceTo: serviceFromValue?.label ?? '',
    });
  }, [serviceFromValue, serviceToValue, setValue]);

  const handleRouteCreateSubmit = useCallback((values: ServiceRouteCreationFormValues) => {
    const { serviceFrom, serviceTo, permissions } = values;
    if (!serviceFrom || !serviceTo) {
      pushAlert({ message: 'Select both services before submitting.', severity: 'warning' });
      return;
    }

    if (serviceFrom.value === serviceTo.value) {
      pushAlert({ message: 'Select two different services for a route.', severity: 'warning' });
      return;
    }

    const serviceFromLabel = serviceFrom.label;
    const serviceToLabel = serviceTo.label;
    const serviceFromId = serviceFrom.value;
    const serviceToId = serviceTo.value;

    const permissionsSummary = permissions.length ? permissions.join(', ') : 'No permissions selected';

    showModal({
      title: 'Register service route',
      content: (
        <Stack spacing={1}>
          <Typography variant="body2">
            Do you want to allow <strong>{serviceFromLabel}</strong> to reach <strong>{serviceToLabel}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Permissions: {permissionsSummary}
          </Typography>
        </Stack>
      ),
      confirmLabel: 'Register route',
      cancelLabel: 'Cancel',
      accent: 'warning',
      onConfirm: () => {
        if (!hasAuth) {
          pushAlert(AUTH_ERROR_ALERT);
          return;
        }

        registerRoute(
          { serviceFromId, serviceToId, permissions },
          {
            onSuccess: () => {
              pushAlert({ message: 'Route registered successfully.', severity: 'success' });
              handleResetCreationForm();
            },
            onError: () => {
              pushAlert({ message: 'Failed to register route.', severity: 'error' });
            },
          },
        );
      },
    });
  }, [handleResetCreationForm, hasAuth, pushAlert, registerRoute, showModal]);

  const isCreateDisabled = !isValid || isRegistering;
  const isSwapDisabled = !serviceFromValue && !serviceToValue;

  return {
    control,
    handleSubmit,
    handleRouteCreateSubmit,
    handleResetCreationForm,
    handleSwapServices,
    serviceFromField: {
      options: serviceFromOptions,
      inputValue: serviceSelectInputs.serviceFrom,
      onInputValueChange: (value: string) => handleServiceInputChange('serviceFrom', value),
      isFetching: serviceFromOptionsQuery.isFetching,
    },
    serviceToField: {
      options: serviceToOptions,
      inputValue: serviceSelectInputs.serviceTo,
      onInputValueChange: (value: string) => handleServiceInputChange('serviceTo', value),
      isFetching: serviceToOptionsQuery.isFetching,
    },
    permissionsOptions: ROUTE_PERMISSION_OPTIONS,
    isRegistering,
    isCreateDisabled,
    isSwapDisabled,
    minSearchChars: SERVICE_SELECT_MIN_SEARCH_CHARS,
  };
}
