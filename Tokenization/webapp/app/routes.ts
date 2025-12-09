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
      index('feature/token/routes/token-overview.tsx'),
      route(':tokenId', 'feature/token/routes/token-details.tsx'),
      route('table', 'feature/token/routes/token-table.tsx'),
      route('new', 'feature/token/routes/token-create.tsx'),
      route('ban', 'feature/token/routes/token-ban.tsx'),
      route('unban', 'feature/token/routes/token-unban.tsx'),
      route('filter', 'feature/token/routes/token-filter.tsx'),
    ]),
    ...prefix('certs', [
      index('feature/cert/routes/cert-overview.tsx'),
      route(':certId', 'feature/cert/routes/cert-details.tsx'),
      route('table', 'feature/cert/routes/cert-table.tsx'),
    ]),
    route('*', 'routes/404.tsx'),
  ]),

] satisfies RouteConfig;
