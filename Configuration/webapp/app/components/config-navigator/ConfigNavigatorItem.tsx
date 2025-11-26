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

/* eslint-disable react/prop-types */

import { memo, useEffect, useMemo, useState, type FC } from 'react';
import {
  Collapse,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { ROUTE_PREFIX } from '~/config';

export interface TreeNode {
  name: string;
  fullPath: string;
  children: Record<string, TreeNode>;
  isFile: boolean;
}

interface ConfigNavigatorItemProps {
  node: TreeNode;
  selectedPath?: string;
  level?: number;
}

/**
 * ConfigNavigatorItem component
 * Represents an item in the configuration navigator.
 * @param {ConfigNavigatorItemProps} props - The props of the component.
 * @param {string} props.title - The title of the configuration item.
 * @param {Function} props.onClick - Callback function to handle item click.
 * @returns {React.ReactElement} ConfigNavigatorItem
 */
const ConfigNavigatorItem: FC<ConfigNavigatorItemProps> = memo(
  ({ node, selectedPath, level = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);

    const isSelected = node.fullPath === selectedPath;
    const paddingLeft = 16 + level * 16;

    useEffect(() => {
      if (!node.isFile && selectedPath && !isOpen) {
        if (selectedPath.startsWith(node.fullPath)) {
          setIsOpen(true);
        }
      }
    }, [selectedPath, node.fullPath, node.isFile, isOpen]);

    const handleFolderClick = () => {
      setIsOpen((prev) => !prev);
    };

    const sortedChildren = useMemo(() => {
      if (node.isFile) {
        return [];
      }

      return Object.values(node.children).sort((a, b) => {
        if (a.isFile === b.isFile) {
          return a.name.localeCompare(b.name);
        }
        return a.isFile ? 1 : -1;
      });
    }, [node.children, node.isFile]);

    if (node.isFile) {
      return (
        <ListItem
          style={{ paddingTop: 5, paddingBottom: 5, paddingLeft }}
          className="config_navigator__item"
        >
          <Link to={`${ROUTE_PREFIX}${node.fullPath}`} style={{ width: '100%' }}>
            <ListItemButton sx={{ borderRadius: 2, padding: 0 }} selected={isSelected}>
              <ListItemIcon>
                <FontAwesomeIcon icon={faFile} style={{ margin: 'auto' }} />
              </ListItemIcon>
              <ListItemText primary={node.name} />
            </ListItemButton>
          </Link>
        </ListItem>
      );
    }
    return (
      <>
        <ListItem
          style={{ paddingTop: 5, paddingBottom: 5, paddingLeft }}
          className="config_navigator__item"
        >
          <ListItemButton onClick={handleFolderClick} sx={{ borderRadius: 2, padding: 0 }}>
            <ListItemIcon>
              <FontAwesomeIcon icon={isOpen ? faFolderOpen : faFolder} style={{ margin: 'auto' }} />
            </ListItemIcon>
            <ListItemText primary={node.name} />
          </ListItemButton>
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {sortedChildren.map((childNode) => (
              <ConfigNavigatorItem
                key={childNode.fullPath}
                node={childNode}
                selectedPath={selectedPath}
                level={level + 1}
              />
            ))}
          </List>
        </Collapse>
      </>
    );
  },
);

ConfigNavigatorItem.displayName = 'ConfigNavigatorItem';

export default ConfigNavigatorItem;
