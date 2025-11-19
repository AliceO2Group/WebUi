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

import { type FC, type PropsWithChildren, type Dispatch, type SetStateAction } from 'react';
import { Box, Drawer } from '@mui/material';
import { LeftDrawerFooter } from './LeftDrawerFooter';
import { LeftDrawerHeader } from './LeftDrawerHeader';

export const DRAWER_WIDTH = 300;

interface LeftDrawerProps extends PropsWithChildren {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * LeftDrawer component
 * Represents the left sidebar of the application layout.
 * @param {LeftDrawerProps} props - The props of the component.
 * @param {ReactElement} props.children - The children elements to render inside the drawer.
 * @param {boolean} props.isOpen - Whether the drawer is open.
 * @param {Dispatch<SetStateAction<boolean>>} props.setIsOpen - Function to set the drawer open state.
 * @returns {ReactElement} LeftDrawer
 */
export const LeftDrawer: FC<LeftDrawerProps> = ({ children, isOpen }) => (
  <Drawer
    sx={{
      width: DRAWER_WIDTH,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: DRAWER_WIDTH,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        transition: (theme) =>
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
    <LeftDrawerHeader />
    <Box sx={{ overflow: 'auto', flexGrow: 1 }}>{children}</Box>
    <LeftDrawerFooter />
  </Drawer>
);
