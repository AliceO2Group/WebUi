/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * All rights not expressly granted are reserved.
 */

import type { TokenLogEntry } from '~/feature/token/types/token';

export const mockActiveTokenLogs: Record<string, TokenLogEntry[]> = {
  '1': [
    { id: '1-1', message: 'Token issued', timestamp: '2025-05-01T10:00:00Z' },
    { id: '1-2', message: 'Token used', timestamp: '2025-08-11T09:45:00Z' },
  ],
  '2': [
    { id: '2-1', message: 'Token issued', timestamp: '2025-04-10T08:00:00Z' },
    { id: '2-2', message: 'Token used', timestamp: '2025-05-20T12:20:00Z' },
  ],
};

export const mockArchivedTokenLogs: Record<string, TokenLogEntry[]> = {
  '3': [
    { id: '3-1', message: 'Token issued', timestamp: '2025-06-15T12:00:00Z' },
    { id: '3-2', message: 'Token used', timestamp: '2025-09-01T18:30:00Z' },
    { id: '3-3', message: 'Token revoked', timestamp: '2025-10-04T07:15:00Z' },
  ],
};
