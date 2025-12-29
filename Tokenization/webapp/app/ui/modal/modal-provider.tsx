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
import type { ButtonProps } from '@mui/material/Button';

import ModalView from './modal';

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

export type ModalState = ModalOptions & { open: boolean };

const accentToColor: Record<ModalAccent, ButtonProps['color']> = {
  default: 'primary',
  danger: 'error',
  warning: 'warning',
  success: 'success',
};

export const ModalContext = createContext<ModalContextValue | undefined>(undefined);

/**
 * Provider component that manages modal dialogs.
 *
 * Usage:
 *
 * ```tsx
 * <ModalProvider>
 *   <App />
 * </ModalProvider>
 * ```
 *
 * Inside any child component, use the `ModalContext` to show or hide modals through useModal hook
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      setConfirming(false);
    }
  }, [modalState, hideModal]);

  const contextValue = useMemo<ModalContextValue>(() => ({ showModal, hideModal }), [showModal, hideModal]);

  const confirmDisabled = confirming || Boolean(modalState?.isLoading);
  const confirmColor = modalState ? accentToColor[modalState.accent ?? 'default'] : 'primary';

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      <ModalView
        modalState={modalState}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
        confirmColor={confirmColor}
        confirmDisabled={confirmDisabled}
        confirming={confirming}
      />
    </ModalContext.Provider>
  );
}
