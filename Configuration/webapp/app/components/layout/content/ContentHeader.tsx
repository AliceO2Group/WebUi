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

import { Toolbar, Typography } from '@mui/material';
import React, { type FC } from 'react';
import { UserSection } from '../../user-section/UserSection';

interface ContentHeaderProps {
  currentPath: string;
}

/**
 * ContentHeader component
 * Represents the header of the content area in the application layout.
 * It displays the current path and includes a user section.
 * @param {ContentHeaderProps} props - Component props.
 * @returns {React.ReactElement} ContentHeader
 */
export const ContentHeader: FC<ContentHeaderProps> = ({ currentPath }) => (
  <Toolbar
    style={{
      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
      display: 'flex',
      justifyContent: 'space-between',
    }}
    className="content-section__header"
  >
    <Typography variant="h5">{currentPath}</Typography>
    <UserSection userName="John D." />
  </Toolbar>
);
