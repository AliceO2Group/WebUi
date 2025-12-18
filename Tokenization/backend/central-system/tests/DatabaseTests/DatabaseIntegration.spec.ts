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

describe('Database - integration (seed verification)', () => {
 
  afterAll(async () => {
    await db.sequelize.close();
  });

  it('should have seeded data in all core tables', async () => {
    const models: any = db.models;

    try {
      const [servicesCount, tokensCount, archiveCount, routesCount, logsCount] =
        await Promise.all([
          models.Service.count(),
          models.Token.count(),
          models.ArchiveToken.count(),
          models.Route.count(),
          models.SystemLog.count(),
        ]);
      expect(servicesCount).toBeGreaterThan(0);
      expect(tokensCount).toBeGreaterThan(0);
      expect(archiveCount).toBeGreaterThan(0);
      expect(routesCount).toBeGreaterThan(0);
      expect(logsCount).toBeGreaterThan(0);
    } catch (e) {
      console.error('DB integration error:', e);
      throw e;
    }
  });
});
