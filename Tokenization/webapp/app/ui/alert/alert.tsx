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

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import type { AlertState } from './alert-provider';

/**
 * Alert View Component
 *
 * @param alertState state of the alert
 * @param handleClose function to handle alert close
 */
export default function AlertView({
  alertState,
  handleClose,
}: {
  alertState: AlertState | null;
  handleClose: () => void;
}) {
  return <Snackbar
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    open={Boolean(alertState?.open)}
    autoHideDuration={alertState?.autoHideDuration}
    onClose={handleClose}
  >
    {alertState ? (
      <Alert onClose={handleClose} severity={alertState.severity} variant="filled" sx={{ width: '100%' }}>
        {alertState.message}
      </Alert>
    ) : <></>}
  </Snackbar>;
}
