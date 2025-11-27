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

import { useCallback, type FC, type PropsWithChildren, type ReactElement } from 'react';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FormData from '@mui/icons-material/ListAlt';
import RawData from '@mui/icons-material/EditNote';
import { IconButton, Typography } from '@mui/material';

interface AccordionHeaderProps extends PropsWithChildren {
  title: string;
  viewForm: boolean;
  viewFormToggle: () => void;
}

export const AccordionHeader: FC<AccordionHeaderProps> = ({
  title,
  viewForm,
  viewFormToggle,
}): ReactElement => {
  const viewFormToggleCallback = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      viewFormToggle();
    },
    [viewFormToggle],
  );

  return (
    <AccordionSummary
      expandIcon={<ExpandLessIcon />}
      sx={{
        backgroundColor: '#E0E0E0',
      }}
      slotProps={{
        expandIconWrapper: { style: { order: -1, marginRight: '6px' } },
      }}
    >
      <Typography sx={{ marginRight: 'auto', alignContent: 'center' }}>{title}</Typography>
      <IconButton onClick={viewFormToggleCallback}>
        {viewForm ? (
          <RawData />
        ) : (
          <FormData />
        )}
      </IconButton>
    </AccordionSummary>
  );
};
