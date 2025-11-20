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

import { useNavigate } from 'react-router';
import { BASE_PATH } from '~/config';

/**
 * useConfigurationNavigate hook
 * Provides a navigate function to navigate to a configuration path.
 * @returns {(relativePath: string) => void} navigate function to navigate to a configuration path.
 */
export const useConfigurationNavigate = () => {
  const reactRouterNavigate = useNavigate();

  const navigate = (relativePath: string) => {
    void reactRouterNavigate(`${BASE_PATH}/${relativePath}`);
  };

  return navigate;
};
