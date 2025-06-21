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
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router';
import { BASE_CONFIGURATION_PATH } from '~/config';

interface ConfigNavigatorItemProps {
  title: string;
  onClick?: () => void;
  isSelected: boolean;
}

const ConfigNavigatorItem: FC<ConfigNavigatorItemProps> = ({
  title,
  onClick,
  isSelected,
}) => {
  return (
    <ListItem
      style={{ paddingTop: 5, paddingBottom: 5, width: '100%' }}
      className="config_navigator__item"
    >
      <Link
        to={`${BASE_CONFIGURATION_PATH}/${title}`}
        style={{ width: '100%' }}
      >
        <ListItemButton
          onClick={onClick}
          sx={{
            borderRadius: 2,
            padding: 0,
          }}
          selected={isSelected}
        >
          <ListItemIcon>
            <FontAwesomeIcon icon={faFile} style={{ margin: 'auto' }} />
          </ListItemIcon>
          <ListItemText primary={title} />
        </ListItemButton>
      </Link>
    </ListItem>
  );
};

export default ConfigNavigatorItem;
