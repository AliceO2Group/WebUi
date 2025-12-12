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

import type { Service } from '~/feature/service/types/service';

export const mockServices: Service[] = [
  {
    serviceId: '1',
    commonName: 'Service One',
    iat: '2025-05-01T08:00:00Z',
    exp: '2026-05-01T08:00:00Z',
  },
  {
    serviceId: '2',
    commonName: 'Service Two',
    iat: '2024-11-15T10:30:00Z',
    exp: '2025-11-15T10:30:00Z',
  },
  {
    serviceId: '3',
    commonName: 'Service Three',
    iat: '2025-08-20T06:15:00Z',
    exp: '2026-08-20T06:15:00Z',
  },
  {
    serviceId: '4',
    commonName: 'Service Four',
    iat: '2023-12-05T14:00:00Z',
    exp: '2024-12-05T14:00:00Z',
  },
  {
    serviceId: '5',
    commonName: 'Service Five',
    iat: '2025-02-10T09:45:00Z',
    exp: '2026-02-10T09:45:00Z',
  },
];
