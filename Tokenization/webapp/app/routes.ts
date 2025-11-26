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
      index('routes/tokens/overview.tsx'),
      route(':tokenId', 'routes/tokens/details.tsx'),
      route('table', 'routes/tokens/table.tsx'),
      route('new', 'routes/tokens/create.tsx'),
    ]),
    ...prefix('certs', [
      index('routes/certs/overview.tsx'),
      route('new', 'routes/certs/create.tsx'),
    ]),
    route('*', 'routes/404.tsx'),
  ]),

] satisfies RouteConfig;
