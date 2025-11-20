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

import { useState, type FC } from 'react';
import { Collapse, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faFolder, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';

export interface TreeNode {
  name: string;
  fullPath: string;
  children: Record<string, TreeNode>;
  isFile: boolean;
}

interface ConfigNavigatorItemProps {
  node: TreeNode;
  selectedPath?: string;
  onSelect: (_path: string) => void;
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
const ConfigNavigatorItem: FC<ConfigNavigatorItemProps> = ({ node, selectedPath, onSelect, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);

  const isSelected = node.fullPath === selectedPath;
  const paddingLeft = 16 + level * 16;

  const handleFolderClick = () => {
    setIsOpen(!isOpen);
  };

  if (node.isFile) {
    return (
      <ListItem style={{ paddingTop: 5, paddingBottom: 5, paddingLeft }} className="config_navigator__item">
        <Link to={`configuration/${node.fullPath}`} style={{ width: '100%' }}>
          <ListItemButton
            onClick={() => onSelect(node.fullPath)}
            color="red"
            sx={{ borderRadius: 2, padding: 0 }}
            selected={isSelected}
          >
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
      <ListItem style={{ paddingTop: 5, paddingBottom: 5, paddingLeft }} className="config_navigator__item">
        <ListItemButton
          onClick={handleFolderClick}
          sx={{ borderRadius: 2, padding: 0 }}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={isOpen ? faFolderOpen : faFolder} style={{ margin: 'auto' }} />
          </ListItemIcon>
          <ListItemText primary={node.name} />
        </ListItemButton>
      </ListItem>
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {Object.values(node.children)
            .sort((a, b) => {
              if (a.isFile === b.isFile) {
                return a.name.localeCompare(b.name);
              }
              return a.isFile ? 1 : -1;
            })
            .map((childNode) => (
              <ConfigNavigatorItem
                key={childNode.fullPath}
                node={childNode}
                selectedPath={selectedPath}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
        </List>
      </Collapse>
    </>
  );
};

export default ConfigNavigatorItem;
