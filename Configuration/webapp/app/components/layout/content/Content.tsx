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

import { Box } from '@mui/material';
import { type FC, type PropsWithChildren } from 'react';
import { ContentHeader } from './ContentHeader';
import { useParams } from 'react-router';
import { useDrawer } from '../../../contexts/DrawerContext';

/**
 * Content component
 * Represents the main content area of the application layout.
 * It includes a header and wraps children components.
 * @param {PropsWithChildren} props - Component props.
 * @returns {React.ReactElement} Content
 */
export const Content: FC<PropsWithChildren> = ({ children }) => {
  const { isOpen, drawerWidth, getTransition } = useDrawer();
  const params = useParams<{ '*': string }>();
  const configPath = params['*'];
  return (
    <Box
      component="main"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        bgcolor: 'background.default',
        marginLeft: isOpen ? 0 : `-${drawerWidth}px`,
        transition: getTransition('content'),
      }}
      className="content-section"
    >
      <ContentHeader currentPath={configPath ?? ''} />
      <Box sx={{ p: 3, overflow: 'auto', flexGrow: 1 }}>{children}</Box>
    </Box>
  );
};
