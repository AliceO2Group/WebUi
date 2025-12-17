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

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { type ReactElement } from 'react';

interface UnsavedChangesModalProps {
  open: boolean;
  onProceed: () => void;
  onSaveAndProceed: () => void;
  onCancel: () => void;
}

/**
 * Modal component that warns users about unsaved changes when navigating away.
 * @param {UnsavedChangesModalProps} props - The props of the modal.
 * @param {boolean} props.open - Whether the modal is open.
 * @param {() => void} props.onProceed - Callback when user chooses to proceed without saving.
 * @param {() => void} props.onSaveAndProceed - Callback when user chooses to save and proceed.
 * @param {() => void} props.onCancel - Callback when user chooses to cancel.
 * @returns {ReactElement} The unsaved changes modal component.
 */
export const UnsavedChangesModal = ({
  open,
  onProceed,
  onSaveAndProceed,
  onCancel,
}: UnsavedChangesModalProps): ReactElement => (
  <Dialog open={open} onClose={onCancel} aria-labelledby="unsaved-changes-dialog-title">
    <DialogTitle id="unsaved-changes-dialog-title">Unsaved Changes</DialogTitle>
    <DialogContent>
      <DialogContentText>You have unsaved changes, do you want to proceed?</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel} color="inherit">
        Cancel
      </Button>
      <Button onClick={onProceed} color="warning">
        Proceed
      </Button>
      <Button onClick={onSaveAndProceed} color="primary" variant="contained">
        Save & Proceed
      </Button>
    </DialogActions>
  </Dialog>
);
