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

export const tokensMock = new Map([
  [
    1,
    {
      id: 1,
      last4chars: 'abcd',
      serviceFrom: 'Service One',
      serviceTo: 'Service Two',
      exp: '2026-01-12T11:31:12',
      issuer: 'central-system',
      iat: '2025-10-01T10:00:00',
      permissions: ['GET', 'POST'],
    },
  ],
  [
    2,
    {
      id: 2,
      last4chars: 'wxyz',
      serviceFrom: 'Service Three',
      serviceTo: 'Service Four',
      exp: '2025-11-15T08:45:30',
      issuer: 'admin-portal',
      iat: '2025-09-15T14:22:10',
      permissions: ['GET'],
    },
  ],
  [
    3,
    {
      id: 3,
      last4chars: 'efgh',
      serviceFrom: 'Service Two',
      serviceTo: 'Service One',
      exp: '2026-03-20T16:30:00',
      issuer: 'central-system',
      iat: '2025-10-02T09:15:00',
      permissions: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  ],
  [
    4,
    {
      id: 4,
      // Last4chars: '1234',
      serviceFrom: 'Service One',
      serviceTo: 'Service Three',
      exp: '2026-02-05T12:00:00',
      issuer: 'api-gateway',
      iat: '2025-09-25T11:30:45',
      permissions: ['GET', 'PUT'],
    },
  ],
]);
