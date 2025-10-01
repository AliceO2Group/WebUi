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
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

import type { OptionType, HttpMethod } from '~/routes/tokens/create';

interface DialogProps {
  showDialogWindow: boolean;
  setShowDialogWindow: React.Dispatch<React.SetStateAction<boolean>>;
}

interface CreationTokenDialogProps extends DialogProps {
  options: OptionType[];
  firstSelectedService: string;
  secondSelectedService: string;
  expirationTime: string;
  selectedMethods: HttpMethod[];
  onCreateToken?: () => void; // Dodaj opcjonalny callback
}

/**
 *
 */
export function CreationTokenDialog({
  showDialogWindow,
  setShowDialogWindow,
  options,
  firstSelectedService,
  secondSelectedService,
  expirationTime,
  selectedMethods,
  onCreateToken,
}: CreationTokenDialogProps) {

  const handleCreate = () => {
    if (onCreateToken) {
      onCreateToken();
    }
  };

  return (
    <Dialog
      open={showDialogWindow}
      onClose={() => setShowDialogWindow(false)}
      slotProps={{
        paper: {
          className: '',
        },
      }}
    >
      <DialogTitle>Confirm Token Creation</DialogTitle>
      <DialogContent>
        <p>Are you sure you want to create this token?</p>
        <p>First machine: {options.find((o) => o.value === firstSelectedService)?.label ?? '-'}</p>
        <p>Second machine: {options.find((o) => o.value === secondSelectedService)?.label ?? '-'}</p>
        <p>Expiration time: {expirationTime} hours</p>
        <p>Permissions: {selectedMethods.join(', ')}</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDialogWindow(false)}>Cancel</Button>
        <Button
          onClick={handleCreate}
          variant="contained"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
