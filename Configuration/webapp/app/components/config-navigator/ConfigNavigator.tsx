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
import { useEffect, useState } from 'react';
import ConfigNavigatorItem from './ConfigNavigatorItem';

/**
 * ConfigNavigator component
 * Represents the configuration navigator sidebar.
 * @returns {React.ReactElement} ConfigNavigator
 */
export const ConfigNavigator = () => {
  const [configKeys, setConfigKeys] = useState<string[]>([]);
  const [isError, setIsError] = useState(false);

  const fetchConfigurationKeys = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/api/configurations');
      const data = (await res.json()) as string[];
      const newConfigKeys = data?.map((key) => key.split('/').pop() ?? '');
      setConfigKeys(newConfigKeys);
    } catch (_error) {
      // temporarily disable the linting rule for this line
      // fetching will be refactored once Tanstack Query is introduced
      // eslint-disable-next-line no-console
      console.error('Error while fetching configuration keys', _error);
      setIsError(true);
    }
  };

  useEffect(() => {
    void fetchConfigurationKeys();
  }, []);

  return (
    <List className="config_navigator">
      {isError ? (
        <p>Error while fetching configuration keys</p>
      ) : (
        configKeys?.map((text) => <ConfigNavigatorItem key={text} title={text} />)
      )}
    </List>
  );
};
