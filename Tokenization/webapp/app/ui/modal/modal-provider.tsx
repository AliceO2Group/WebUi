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

import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import type { ButtonProps } from '@mui/material/Button';
import { Spinner } from '~/ui/spinner';

export type ModalAccent = 'default' | 'danger' | 'warning' | 'success';

export type ModalOptions = {
  title: ReactNode;
  content?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  accent?: ModalAccent;
  isLoading?: boolean;
  onConfirm?: () => void | Promise<void>;
};

export type ModalContextValue = {
  showModal: (options: ModalOptions) => void;
  hideModal: () => void;
};

type ModalState = ModalOptions & { open: boolean };

const accentToColor: Record<ModalAccent, ButtonProps['color']> = {
  default: 'primary',
  danger: 'error',
  warning: 'warning',
  success: 'success',
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

/**
 *
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [confirming, setConfirming] = useState(false);

  const hideModal = useCallback(() => {
    setModalState(null);
    setConfirming(false);
  }, []);

  const showModal = useCallback((options: ModalOptions) => {
    setModalState({
      title: options.title,
      content: options.content,
      open: true,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      cancelLabel: options.cancelLabel ?? 'Cancel',
      accent: options.accent ?? 'default',
      onConfirm: options.onConfirm,
      isLoading: options.isLoading ?? false,
    });
    setConfirming(false);
  }, []);

  const handleClose = useCallback(() => {
    hideModal();
  }, [hideModal]);

  const handleConfirm = useCallback(async () => {
    if (!modalState) {
      return;
    }
    const handler = modalState.onConfirm;
    if (!handler) {
      hideModal();
      return;
    }
    setConfirming(true);
    try {
      await handler();
      hideModal();
    } catch (error) {
      console.error('Modal confirm handler failed', error);
      setConfirming(false);
    }
  }, [modalState, hideModal]);

  const contextValue = useMemo<ModalContextValue>(() => ({ showModal, hideModal }), [showModal, hideModal]);

  const confirmDisabled = confirming || Boolean(modalState?.isLoading);
  const confirmColor = modalState ? accentToColor[modalState.accent ?? 'default'] : 'primary';

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <Dialog open={Boolean(modalState?.open)} onClose={handleClose} maxWidth="sm" fullWidth>
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
    </ModalContext.Provider>
  );
}

const ContentStack = styled(Stack)(({ theme }) => ({
  minHeight: theme.spacing(3),
}));

const LoadingRow = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));
