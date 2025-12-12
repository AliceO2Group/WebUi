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

import type { Token } from '~/feature/token/types/token';

export const mockTokens: Token[] = [
  {
    tokenId: '1',
    serviceFrom: 'Service One',
    serviceTo: 'Service Two',
    exp: '2025-12-01T10:00:00Z',
    last4chars: 'd9f1',
    issuer: 'token-service',
    iat: '2025-05-01T10:00:00Z',
    permissions: ['GET', 'POST'],
    status: 'active',
  },
  {
    tokenId: '2',
    serviceFrom: 'Service Two',
    serviceTo: 'Service One',
    exp: '2025-09-18T08:00:00Z',
    last4chars: 'aa10',
    issuer: 'token-service',
    iat: '2025-04-10T08:00:00Z',
    permissions: ['GET'],
    status: 'active',
  },
  {
    tokenId: '3',
    serviceFrom: 'Service Three',
    serviceTo: 'Service Four',
    exp: '2026-01-03T12:00:00Z',
    last4chars: '0042',
    issuer: 'token-service',
    iat: '2025-06-15T12:00:00Z',
    permissions: ['GET', 'POST', 'DELETE'],
    status: 'not-active',
  },
];
