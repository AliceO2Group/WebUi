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


import type { ButtonProps } from '@mui/material/Button';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { Spinner } from '~/ui/spinner';
import type { ModalState } from './modal-provider';

/**
 * Modal View Component
 * 
 * @param modalState state of the modal
 * @param handleClose function to handle modal close
 * @param handleConfirm function to handle modal confirm
 * @param confirmColor color of the confirm button
 * @param confirmDisabled whether the confirm button is disabled
 * @param confirming whether the modal is in a confirming state
 * @returns 
 */
export default function ModalView({
    modalState,
    handleClose,
    handleConfirm,
    confirmColor,
    confirmDisabled,
    confirming,
}: {
    modalState: ModalState | null;
    handleClose: () => void;
    handleConfirm: () => void;
    confirmColor: ButtonProps['color'];
    confirmDisabled: boolean;
    confirming: boolean;
}) {

    return <Dialog open={Boolean(modalState?.open)} onClose={handleClose} maxWidth="sm" fullWidth>
        {modalState ? (
          <Stack spacing={0}>
            <DialogTitle>{modalState.title}</DialogTitle>
            <DialogContent dividers>
              <ContentStack spacing={2}>
                {modalState.isLoading ? (
                  <LoadingRow>
                    <Spinner size={4} /> loading...
                  </LoadingRow>
                ) : null}
                {typeof modalState.content === 'string' ? (
                  <Typography variant="body1">{modalState.content}</Typography>
                ) : (
                  modalState.content ?? null
                )}
              </ContentStack>
            </DialogContent>
            <DialogActions>
              {modalState.cancelLabel ? (
                <Button onClick={handleClose} color="inherit" disabled={confirming}>
                  {modalState.cancelLabel}
                </Button>
              ) : null}
              <Button
                variant="contained"
                color={confirmColor}
                onClick={handleConfirm}
                disabled={confirmDisabled}
              >
                {confirming ? <Spinner size={2} /> : modalState.confirmLabel}
              </Button>
            </DialogActions>
          </Stack>
        ) : null}
      </Dialog>
}

const ContentStack = styled(Stack)(({ theme }) => ({
  minHeight: theme.spacing(3),
}));

const LoadingRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));
