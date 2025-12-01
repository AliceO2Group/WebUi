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

import { Link } from 'react-router';
import { ROUTE_PREFIX } from '~/config';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';

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
 * @param {TreeNode} props.node - The data node representing the file or folder.
 * @param {string} props.selectedPath - The currently active configuration path (used for highlighting).
 * @param {number} [props.level=0] - The nesting depth level (used for indentation).
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
            <ListItemButton sx={{ borderRadius: 2, padding: 0, height: 40 }} selected={isSelected}>
              <ListItemIcon>
                <InsertDriveFileIcon style={{ margin: 'auto' }} />
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
              {isOpen ? (
                <FolderOpenIcon style={{ margin: 'auto' }} />
              ) : (
                <FolderIcon style={{ margin: 'auto' }} />
              )}
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
