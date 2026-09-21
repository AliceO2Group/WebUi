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

import type { ConfigurationKeysResponse } from '~/api/query/useConfigurationKeysQuery';
import type { TreeNode } from '~/components/config-navigator/ConfigNavigatorItem';
import { CONFIGURATION_KEY_PREFIX } from '~/config';

export const buildTree = (
  paths: ConfigurationKeysResponse,
): Record<ConfigurationKeysResponse[number], TreeNode> => {
  const root: Record<ConfigurationKeysResponse[number], TreeNode> = {};

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

      const separator =
        currentFullPathBuilder.endsWith('/') || currentFullPathBuilder === '' ? '' : '/';
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
