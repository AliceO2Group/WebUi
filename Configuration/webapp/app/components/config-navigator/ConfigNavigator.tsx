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
import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { ROUTE_PREFIX } from '~/config';
import { useLocation } from 'react-router';
import { ConfigNavigatorLoader } from './ConfigNavigatorLoader';
import { useConfigurationNavigate } from '~/hooks/useConfigurationNavigate';
import { buildTree } from '~/utils/configuration-tree-builder';
import { useDrawer } from '~/contexts/DrawerContext';

/**
 * ConfigNavigator component
 * Represents the list of avaiable configuration keys.
 * Enables navigation to different configuration items.
 * @returns {React.ReactElement} ConfigNavigator
 */
export const ConfigNavigator = () => {
  const {
    data: configKeys,
    isError,
    error,
    isLoading: areConfigKeysLoading,
  } = useConfigurationKeysQuery();

  const [selectedConfigurationPath, setSelectedConfigurationPath] = useState<string | undefined>();

  const { pathname } = useLocation();
  const navigate = useConfigurationNavigate();

  const { searchTerm } = useDrawer();
  const deferredSearch = useDeferredValue(searchTerm);

  useEffect(() => {
    if (configKeys && configKeys.length > 0) {
      const pathToCheck = pathname.startsWith(ROUTE_PREFIX)
        ? pathname.slice(ROUTE_PREFIX.length)
        : pathname;
      const decodedPath = decodeURIComponent(pathToCheck);

      if (configKeys.includes(decodedPath)) {
        setSelectedConfigurationPath(decodedPath);
      } else {
        navigate(configKeys[0]);
      }
    }
  }, [configKeys, areConfigKeysLoading, pathname]);

  const searchableData = useMemo(() => {
    if (!configKeys) {
      return [];
    }
    return configKeys.map((key) => ({
      original: key,
      searchable: key.slice(ROUTE_PREFIX.length).toLowerCase(),
    }));
  }, [configKeys]);

  const treeData = useMemo(() => {
    if (!configKeys) {
      return {};
    }

    let keysToProcess = configKeys;
    if (deferredSearch.trim() !== '') {
      const lowerTerm = deferredSearch.toLowerCase();
      keysToProcess = searchableData
        .filter((item) => item.searchable.includes(lowerTerm))
        .map((item) => item.original);
    }

    return buildTree(keysToProcess);
  }, [configKeys, deferredSearch]);

  if (areConfigKeysLoading) {
    return <ConfigNavigatorLoader />;
  }

  return (
    <List className="config_navigator" component="nav">
      {isError ? (
        <p style={{ padding: 16, color: 'red' }}>Error: {error?.message ?? 'Unknown error'}</p>
      ) : (
        Object.values(treeData).map((node) => (
          <ConfigNavigatorItem
            key={node.name}
            node={node}
            selectedPath={selectedConfigurationPath}
          />
        ))
      )}
    </List>
  );
};
