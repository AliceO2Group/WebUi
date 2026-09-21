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

import { IconButton, Toolbar, Typography } from '@mui/material';
import { useDrawer } from '~/contexts/DrawerContext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

/**
 * LeftDrawerHeader component
 * Represents the header of the left drawer in the application layout.
 * @returns {React.ReactElement} LeftDrawerHeader
 */
export const LeftDrawerHeader = () => {
  const { toggleDrawer } = useDrawer();
  return (
    <Toolbar
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        paddingRight: 0,
      }}
      className="left-drawer__header"
    >
      <Typography variant="h5">Configuration GUI</Typography>
      <IconButton onClick={toggleDrawer}>
        <ChevronLeftIcon fontSize="large" />
      </IconButton>
    </Toolbar>
  );
};
