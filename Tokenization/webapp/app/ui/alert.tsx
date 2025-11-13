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

import React from 'react';
import { Snackbar, Alert } from '@mui/material';

interface AlertProps {
  openSnackbar?: boolean;
  setOpenSnackbar: React.Dispatch<React.SetStateAction<boolean>>;
  snackbarMessage?: string;
}

/**
 * DangerAlert
 *
 * A reusable component to display error alerts using MUI's Snackbar and Alert components.
 *
 * @param props.openSnackbar Boolean to control the visibility of the snackbar.
 * @param props.setOpenSnackbar Function to update the visibility state of the snackbar.
 * @param props.snackbarMessage The message to display inside the alert.
 */
export function DangerAlert({ openSnackbar, setOpenSnackbar, snackbarMessage }: AlertProps) {

  return (
    <Snackbar
      id="danger-alert"
      open={openSnackbar}
      autoHideDuration={8000}
      onClose={() => setOpenSnackbar(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert onClose={() => setOpenSnackbar(false)} severity="error" sx={{ width: '100%' }}>
        {snackbarMessage}
      </Alert>
    </Snackbar>
  );
}
