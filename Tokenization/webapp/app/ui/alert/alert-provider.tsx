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
import type { AlertColor } from '@mui/material/Alert';
import AlertView from './alert';

export type AlertOptions = {
  message: string;
  severity?: AlertColor;
  autoHideDuration?: number;
};

export type AlertState = {
  message: string;
  severity: AlertColor;
  autoHideDuration: number;
  open: boolean;
};

type AlertContextValue = {
  pushAlert: (options: AlertOptions) => void;
};

/**
 * Context for alert management enabling alert display from any component.
 */
export const AlertContext = createContext<AlertContextValue | undefined>(undefined);

/**
 * Alert provider component to display alerts using MUI Snackbar and Alert components.
 *
 * @param props.children - children for provider
 */
export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  const pushAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      message: options.message,
      severity: options.severity ?? 'info',
      autoHideDuration: options.autoHideDuration ?? 6000,
      open: true,
    });
  }, []);

  const handleClose = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertState((current) => (current ? { ...current, open: false } : current));
  }, []);

  const contextValue = useMemo(() => ({ pushAlert }), [pushAlert]);

  return (
    <AlertContext.Provider value={contextValue}>
      {children}
      <AlertView
        alertState={alertState}
        handleClose={handleClose}
      />
    </AlertContext.Provider>
  );
}
