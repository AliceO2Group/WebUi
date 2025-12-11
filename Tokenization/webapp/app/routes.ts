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

import { type RouteConfig, index, route, prefix } from '@react-router/dev/routes';

export default [
  route('', 'ui/layout.tsx', [
    index('routes/home.tsx'),
    ...prefix('tokens', [
      route('active', 'feature/token/routes/overview.tsx'),
      route('archived', 'feature/token/routes/archived.tsx'),
      route(':tokenId', 'feature/token/routes/details.tsx'),
    ]),
    ...prefix('services', [
      route('overview', 'feature/service/routes/overview.tsx'),
      route('new', 'feature/service/routes/registration.tsx'),
      route(':id', 'feature/service/routes/details.tsx'),
    ]),
    ...prefix('routes', [
      route('overview', 'feature/service-routes/routes/overview.tsx'),
      route('mapping', 'feature/service-routes/routes/mapping.tsx'),
      route(':id', 'feature/service-routes/routes/details.tsx'),
    ]),
    route('*', 'routes/404.tsx'),
  ]),

] satisfies RouteConfig;
