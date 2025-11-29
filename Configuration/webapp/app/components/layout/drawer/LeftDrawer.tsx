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

import { type FC, type PropsWithChildren } from 'react';
import { Box, Divider, Drawer } from '@mui/material';
import { LeftDrawerFooter } from './LeftDrawerFooter';
import { LeftDrawerHeader } from './LeftDrawerHeader';
import { useDrawer } from '../../../contexts/DrawerContext';

/**
 * LeftDrawer component
 * Represents the left sidebar of the application layout.
 * @param {PropsWithChildren} props - The props of the component.
 * @param {ReactElement} props.children - The children elements to render inside the drawer.
 * @returns {ReactElement} LeftDrawer
 */
export const LeftDrawer: FC<PropsWithChildren> = ({ children }) => {
  const { isOpen, drawerWidth, isResizing, handleResize } = useDrawer();

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: isResizing
            ? 'none'
            : (theme) =>
                theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
        },
      }}
      variant="persistent"
      anchor="left"
      className="left-drawer"
      open={isOpen}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
        <Box
          sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}
        >
          <LeftDrawerHeader />
          <Box sx={{ overflow: 'auto', flexGrow: 1 }}>{children}</Box>
          <LeftDrawerFooter />
        </Box>
        <Divider
          orientation="vertical"
          flexItem
          onMouseDown={handleResize}
          sx={{
            backgroundColor: isResizing ? 'primary.main' : 'rgba(0, 0, 0, 0.12)',
            width: '4px',
            flexShrink: 0,
            cursor: 'col-resize',
            '&:hover': {
              backgroundColor: 'primary.light',
            },
            transition: 'background-color 0.2s',
          }}
        />
      </Box>
    </Drawer>
  );
};
