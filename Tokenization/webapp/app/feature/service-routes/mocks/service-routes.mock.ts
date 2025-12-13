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

import type { ServiceRoute } from '~/feature/service-routes/types/service-route';

export const mockServiceRoutes: ServiceRoute[] = [
  {
    routeId: 'route-001',
    serviceFrom: 'Service One',
    serviceTo: 'Service Two',
    permissions: ['GET', 'POST'],
  },
  {
    routeId: 'route-002',
    serviceFrom: 'Service One',
    serviceTo: 'Service Five',
    permissions: ['GET'],
  },
  {
    routeId: 'route-003',
    serviceFrom: 'Service Two',
    serviceTo: 'Service One',
    permissions: ['GET', 'DELETE'],
  },
  {
    routeId: 'route-004',
    serviceFrom: 'Service Two',
    serviceTo: 'Service Four',
    permissions: ['GET', 'POST'],
  },
  {
    routeId: 'route-005',
    serviceFrom: 'Service Three',
    serviceTo: 'Service Two',
    permissions: ['GET', 'PUT'],
  },
  {
    routeId: 'route-006',
    serviceFrom: 'Service Three',
    serviceTo: 'Service Four',
    permissions: ['GET'],
  },
  {
    routeId: 'route-007',
    serviceFrom: 'Service Four',
    serviceTo: 'Service Five',
    permissions: ['GET', 'POST', 'DELETE'],
  },
  {
    routeId: 'route-008',
    serviceFrom: 'Service Five',
    serviceTo: 'Service Three',
    permissions: ['GET', 'PATCH'],
  },
];
