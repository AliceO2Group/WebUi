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

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

type AppHeaderProps = {
  title?: string;
};

/**
 * AppHeader
 *
 * Displays the application header with navigation icons (home, settings) and a customizable title.
 * @param headerContent.headerContent
 * @param headerContent Optional string to display as the header title.
 */
export function AppHeader({ title = 'Tokenization System' }: AppHeaderProps) {
  return (
    <AppBar
      position="static"
      elevation={0}
      color="inherit"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: 4 }}>
        <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
