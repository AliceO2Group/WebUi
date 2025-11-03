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

import { type FC } from 'react';
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';

interface ConfigNavigatorItemProps {
  title: string;
  onClick?: () => void;
}

/**
 * ConfigNavigatorItem component
 * Represents an item in the configuration navigator.
 * @param {ConfigNavigatorItemProps} props - The props of the component.
 * @param {string} props.title - The title of the configuration item.
 * @param {Function} props.onClick - Callback function to handle item click.
 * @returns {React.ReactElement} ConfigNavigatorItem
 */
const ConfigNavigatorItem: FC<ConfigNavigatorItemProps> = ({ title, onClick }) => (
  <ListItem style={{ paddingTop: 5, paddingBottom: 5 }} className="config_navigator__item">
    <ListItemButton onClick={onClick} color="red" sx={{ borderRadius: 2, padding: 0 }}>
      <ListItemIcon>
        <FontAwesomeIcon icon={faFile} style={{ margin: 'auto' }} />
      </ListItemIcon>
      <ListItemText primary={title} />
    </ListItemButton>
  </ListItem>
);

export default ConfigNavigatorItem;
