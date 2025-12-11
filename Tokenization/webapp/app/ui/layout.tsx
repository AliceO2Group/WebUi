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

import { Outlet, useNavigation } from 'react-router';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import { AppHeader } from './header';
import { AppSidebar } from './sidebar';
import { Spinner } from './spinner';

/**
 * Component provides main layout for the application
 * Uses useNavigation state to check if page is loaded
 */
const SIDEBAR_WIDTH = 240;

export default function Layout() {
  const { state } = useNavigation();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.100' }}>
      <CssBaseline />
      <AppSidebar width={SIDEBAR_WIDTH} />
      <Box component="section" sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppHeader />
        <Box component="main" sx={{ flex: 1, p: 4, overflow: 'auto' }}>
          {state === 'loading' ? <Spinner /> : <Outlet />}
        </Box>
      </Box>
    </Box>
  );
}
