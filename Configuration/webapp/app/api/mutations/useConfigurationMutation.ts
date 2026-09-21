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
import axiosInstance from '../axiosInstance';
import { CONFIGURATION_QUERY_KEY } from '../query/useConfigurationQuery';
import { CONFIGURATION_RESTRICTIONS_QUERY_KEY } from '../query/useConfigurationRestrictionsQuery';
import type { FormValue } from '~/components/form/types';

/**
 * useConfigurationMutation hook
 * Provides a mutation to save configuration data.
 * @param {string} configurationName - The name of the configuration to save.
 * @returns {UseMutationResult} The mutation result.
 */
export const useConfigurationMutation = (configurationName: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (configuration: FormValue) => {
      const response = await axiosInstance.put<FormValue>(
        `configurations/${configurationName}`,
        JSON.stringify({ configuration }),
      );
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [CONFIGURATION_QUERY_KEY, configurationName],
      });
      void queryClient.invalidateQueries({
        queryKey: [CONFIGURATION_RESTRICTIONS_QUERY_KEY, configurationName],
      });
    },
  });
};
