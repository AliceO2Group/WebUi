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

import { Box, IconButton, Toolbar, Typography } from '@mui/material';
import { type FC } from 'react';
import { UserSection } from '../../user-section/UserSection';
import { useDrawer } from '~/contexts/DrawerContext';
import MenuIcon from '@mui/icons-material/Menu';

interface ContentHeaderProps {
  currentPath: string;
}

/**
 * Content component
 * Represents the header of the content area.
 * @param {ContentHeaderProps} props - The props of the component.
 * @param {string} props.currentPath - Current configuration path.
 * @returns {React.ReactElement} Content
 */
export const ContentHeader: FC<ContentHeaderProps> = ({ currentPath }) => {
  const { isOpen, toggleDrawer } = useDrawer();
  return (
    <Toolbar
      style={{
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
      }}
      className="content-section__header"
    >
      <Box display="flex" alignItems="center" gap={1}>
        {!isOpen && (
          <IconButton onClick={toggleDrawer}>
            <MenuIcon fontSize="large" />
          </IconButton>
        )}
        <Typography variant="h5" className="config-page__header__text">
          {currentPath}
        </Typography>
      </Box>
      <UserSection />
    </Toolbar>
  );
};
