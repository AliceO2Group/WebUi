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

import React from 'react';
import { Box, Drawer, List, ListItem, ListItemText } from '@mui/material';
import LeftDrawerFooter from './LeftDrawerFooter';
import LeftDrawerHeader from './LeftDrawerHeader';

const DRAWER_WIDTH = 250;

const LeftDrawer = () => (
  <Drawer
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      },
    }}
    variant="permanent"
    anchor="left"
    className="left-drawer"
  >
    <LeftDrawerHeader />
    <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
      <List>
        {['Item 1', 'Item 2', 'Item 3', 'Item 4'].map((text) => (
          <ListItem key={text}>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Box>
    <LeftDrawerFooter />
  </Drawer>
);

export default LeftDrawer;
