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
import axiosInstance from '../axiosInstance';
import { BASE_CONFIGURATION_PATH } from '~/config';
import type { FormValue } from '~/components/form/Form';

export const CONFIGURATION_QUERY_KEY = 'configuration';

export const useConfigurationQuery = (configuration: string) =>
  useQuery({
    queryKey: [CONFIGURATION_QUERY_KEY, configuration],
    queryFn: async () =>
      axiosInstance
        .get<FormValue>(`configurations/${BASE_CONFIGURATION_PATH}/${configuration}`)
        .then((response) => response.data),
  });
