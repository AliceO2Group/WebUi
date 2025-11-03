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

import { List } from '@mui/material';
import ConfigNavigatorItem from './ConfigNavigatorItem';
import { useConfigurationKeysQuery } from '~/api/query/useConfigurationKeysQuery';

export const ConfigNavigator = () => {
  const { data: configKeys, isError, error } = useConfigurationKeysQuery();

  return (
    <List className="config_navigator">
      {isError ? (
        <p>Error while fetching configuration keys: {error?.message ?? 'Unknown error'}</p>
      ) : (
        configKeys?.map((text: string) => <ConfigNavigatorItem key={text} title={text} />)
      )}
    </List>
  );
};
