import React, { type FC } from 'react';
import {
  Icon,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile } from '@fortawesome/free-solid-svg-icons';

interface ConfigNavigatorItemProps {
  title: string;
  onClick?: () => void;
}

const ConfigNavigatorItem: FC<ConfigNavigatorItemProps> = ({
  title,
  onClick,
}) => {
  return (
    <ListItem>
      <ListItemButton onClick={onClick} color="red" sx={{ borderRadius: 2 }}>
        <ListItemIcon>
          <FontAwesomeIcon icon={faFile} />
        </ListItemIcon>
        <ListItemText primary={title} />
      </ListItemButton>
    </ListItem>
  );
};

export default ConfigNavigatorItem;
