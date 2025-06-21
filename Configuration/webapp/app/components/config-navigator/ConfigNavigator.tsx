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
import { useEffect, useState } from 'react';
import { useConfigurationNavigate } from '~/hooks/useConfigurationNavigate';

const ConfigNavigator = () => {
  const { data: configKeys, isLoading: areConfigKeysLoading } =
    useConfigurationKeysQuery();

  const navigate = useConfigurationNavigate();

  const [selectedConfigurationPath, setSelectedConfigurationPath] = useState<
    string | undefined
  >();

  useEffect(() => {
    if (configKeys) {
      setSelectedConfigurationPath(configKeys[0]);
      navigate(configKeys[0]);
    }
  }, [configKeys, areConfigKeysLoading]);

  return (
    <List>
      {configKeys?.map((configKey: string) => (
        <ConfigNavigatorItem
          key={configKey}
          title={configKey}
          isSelected={configKey === selectedConfigurationPath}
          onClick={() => {
            setSelectedConfigurationPath(configKey);
          }}
        />
      ))}
    </List>
  );
};

export default ConfigNavigator;
