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
import ConfigNavigatorItem, { type TreeNode } from './ConfigNavigatorItem';
import { useConfigurationKeysQuery } from '~/api/query/useConfigurationKeysQuery';
import { useEffect, useMemo, useState } from 'react';
import { CONFIGURATION_KEY_PREFIX, ROUTE_PREFIX } from '~/config';
import { useLocation } from 'react-router';

const buildTree = (paths: string[]): Record<string, TreeNode> => {
  const root: Record<string, TreeNode> = {};

  paths.forEach((path) => {
    let relativePath = path;

    if (path.startsWith(CONFIGURATION_KEY_PREFIX)) {
      relativePath = path.slice(CONFIGURATION_KEY_PREFIX.length).replace(/^\//, '');
    }

    const parts = relativePath.split('/');
    let currentLevel = root;
    let currentFullPathBuilder = CONFIGURATION_KEY_PREFIX;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      const separator = currentFullPathBuilder.endsWith('/') || currentFullPathBuilder === '' ? '' : '/';
      currentFullPathBuilder += `${separator}${part}`;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          fullPath: isLast ? path : currentFullPathBuilder,
          children: {},
          isFile: isLast,
        };
      }

      if (!isLast) {
        currentLevel = currentLevel[part].children;
      }
    });
  });

  return root;
};

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

  useEffect(() => {
    if (configKeys && configKeys.length > 0) {
      const pathToCheck = pathname.startsWith(ROUTE_PREFIX) ? pathname.slice(ROUTE_PREFIX.length) : pathname;
      const decodedPath = decodeURIComponent(pathToCheck);

      if (configKeys.includes(decodedPath)) {
        setSelectedConfigurationPath(decodedPath);
      }
    }
  }, [configKeys, areConfigKeysLoading, pathname]);

  const treeData = useMemo(() => {
    if (!configKeys) {
      return {};
    }
    return buildTree(configKeys);
  }, [configKeys]);

  return (
    <List className="config_navigator" component="nav">
      {isError ? (
        <p style={{ padding: 16, color: 'red' }}>Error: {error?.message ?? 'Unknown error'}</p>
      ) : (
        Object.values(treeData)
          .sort((a, b) => {
            if (a.isFile === b.isFile) {
              return a.name.localeCompare(b.name);
            }
            return a.isFile ? 1 : -1;
          })
          .map((node) => (
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
