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

import { db } from '../../dist/lib/database/Database.js';

describe('Database – integration (seed verification)', () => {
  beforeAll(async () => {
    if ((process.env.DB_SEED ?? 'false') !== 'true') {
      throw new Error('DB_SEED must be true for Database integration tests');
    }
  });

  it('should have seeded data in all core tables', async () => {
    const { Service, Token, ArchiveToken, Route, SystemLog } = db.models as any;

    const [
      servicesCount,
      tokensCount,
      archiveTokensCount,
      routesCount,
      logsCount,
    ] = await Promise.all([
      Service.count(),
      Token.count(),
      ArchiveToken.count(),
      Route.count(),
      SystemLog.count(),
    ]);

    expect(servicesCount).toBeGreaterThan(0);
    expect(tokensCount).toBeGreaterThan(0);
    expect(archiveTokensCount).toBeGreaterThan(0);
    expect(routesCount).toBeGreaterThan(0);
    expect(logsCount).toBeGreaterThan(0);
  });
});
