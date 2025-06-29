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

import { Box, Stack } from '@mui/material';
import { type FC, type PropsWithChildren } from 'react';
import ContentHeader from './ContentHeader';
import { useParams } from 'react-router';

interface ContentProps extends PropsWithChildren {}

const Content: FC<ContentProps> = ({ children }) => {
  const params = useParams<{ '*': string }>();
  const configPath = params['*'];
  return (
    <Stack
      component="main"
      sx={{ flexGrow: 1, bgcolor: 'background.default' }}
      className="content-section"
    >
      <ContentHeader currentPath={configPath ?? '<no path selected>'} />
      <Box sx={{ p: 3, overflow: "auto", flexGrow: 1, minHeight: 0 }}>{children}</Box>
    </Stack>
  );
};

export default Content;
