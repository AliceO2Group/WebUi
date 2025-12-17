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

import { Box, Collapse, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Previous Value Section component.
 * @param {PreviousValueSectionProps} props - The props of the previous value section.
 * @param {string | number | boolean} props.value - The value of the previous value.
 * @param {boolean} props.isDirty - Whether the form is dirty.
 * @returns {ReactElement} The previous value section component.
 */
export const PreviousValueSection = ({
  value,
  isDirty,
}: {
  value: string | number | boolean;
  isDirty: boolean;
}): ReactNode => (
  <Collapse in={isDirty} timeout="auto">
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: 1,
      }}
    >
      <Typography variant="caption" fontWeight="bold" color="secondary">
        Previous Value:
      </Typography>
      <Typography variant="caption">{JSON.stringify(value, null, 2)}</Typography>
    </Box>
  </Collapse>
);
