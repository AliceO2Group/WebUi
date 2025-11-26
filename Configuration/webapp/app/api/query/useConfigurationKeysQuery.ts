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
import type { UseQueryResult } from '@tanstack/react-query';
import type { AxiosResponse } from 'axios';
import axiosInstance from '../axiosInstance';

export const CONFIGURATION_KEYS_QUERY_KEY = 'configuration-keys';

type ConfigurationKeysResponse = string[];

/**
 * useConfigurationKeysQuery hook
 * Fetches the list of configuration keys from the backend API.
 * @returns {UseQueryResult<string[], Error>} query result containing the list of configuration keys.
 */
export const useConfigurationKeysQuery = (): UseQueryResult<ConfigurationKeysResponse, Error> =>
  useQuery<string[], Error>({
    queryKey: [CONFIGURATION_KEYS_QUERY_KEY],
    queryFn: async (): Promise<string[]> => {
      const response: AxiosResponse<ConfigurationKeysResponse> = await axiosInstance.get(
        'configurations/?recurse=true',
      );
      return response.data;
    },
  });
