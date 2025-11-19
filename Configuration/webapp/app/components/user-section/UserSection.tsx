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

import { Box, IconButton, Menu, MenuItem, Avatar } from '@mui/material';
import { useState, type MouseEvent } from 'react';
import { useAuth } from '~/hooks/useAuth';
import { getSessionData } from '~/services/session';

/**
 * UserSection component
 * Represents a user section with an avatar and a dropdown menu for user actions.
 * @returns {React.ReactElement} UserSection
 */
export const UserSection = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { name: userName } = useAuth();
  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const displayProfileData = () => {
    const getData = async () => {
      const data = await getSessionData();
      alert(JSON.stringify(data));
    };

    void getData();
  };

  return (
    <Box sx={{ flexGrow: 0 }} className="user-section">
      <IconButton sx={{ p: 0 }} onClick={handleClick}>
        <Avatar>{userName?.[0] ?? ''}</Avatar>
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
        <section style={{ padding: 10 }}>
          <h5>Welcome, {userName}!</h5>
          <MenuItem onClick={displayProfileData}>Profile</MenuItem>
          <MenuItem onClick={handleClose}>My account</MenuItem>
          <MenuItem onClick={handleClose}>Logout</MenuItem>
        </section>
      </Menu>
    </Box>
  );
};
