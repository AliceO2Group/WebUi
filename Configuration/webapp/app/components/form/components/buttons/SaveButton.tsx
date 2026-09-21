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

import { Fab, Typography } from '@mui/material';

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const fabStyle = {
  position: 'absolute',
  bottom: 16,
  right: 16,
  padding: 5,
};

/**
 * Save button component.
 * @param {SaveButtonProps} props - The props of the save button.
 * @param {() => void} props.onClick - The callback to click the save button.
 * @param {boolean} props.disabled - Whether the save button is disabled.
 * @returns {ReactElement} The save button component.
 */
export const SaveButton = ({ onClick, disabled }: SaveButtonProps) => (
  <Fab
    color="primary"
    aria-label="add"
    onClick={onClick}
    disabled={disabled}
    sx={fabStyle}
    variant="extended"
  >
    <Typography variant="h6">SAVE</Typography>
  </Fab>
);
