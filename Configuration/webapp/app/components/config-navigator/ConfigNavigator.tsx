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
import { useConfigurationNavigate } from '~/hooks/useConfigurationNavigate';
import { BASE_CONFIGURATION_PATH } from '~/config';

const buildTree = (paths: string[]): Record<string, TreeNode> => {
  const root: Record<string, TreeNode> = {};

  paths.forEach((path) => {
    let relativePath = path;
    if (path.startsWith(BASE_CONFIGURATION_PATH)) {
      relativePath = path.substring(BASE_CONFIGURATION_PATH.length);
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
    }

    const parts = relativePath.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          fullPath: isLast ? path : '',
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

  const navigate = useConfigurationNavigate();

  useEffect(() => {
    if (configKeys) {
      setSelectedConfigurationPath(configKeys[0]);
      navigate(configKeys[0]);
    }
  }, [configKeys, areConfigKeysLoading]);

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
              onSelect={(path) => {
                setSelectedConfigurationPath(path);
                if (path.startsWith(BASE_CONFIGURATION_PATH)) {
                  const relative = path.substring(BASE_CONFIGURATION_PATH.length).replace(/^\//, '');
                  navigate(relative);
                } else {
                  navigate(path);
                }
              }}
            />
          ))
      )}
    </List>
  );
};
