import React from 'react';
import { Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';

interface UserSectionProps {
  userName: string;
}

const UserSection: React.FC<UserSectionProps> = ({ userName }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 0 }} className="user-section">
      <IconButton sx={{ p: 0 }} onClick={handleClick}>
        <Avatar>{userName[0]}</Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        className="user-section__menu"
      >
        <MenuItem onClick={handleClose}>Profile</MenuItem>
        <MenuItem onClick={handleClose}>My account</MenuItem>
        <MenuItem onClick={handleClose}>Logout</MenuItem>
      </Menu>
    </Box>
  );
};

export default UserSection;
