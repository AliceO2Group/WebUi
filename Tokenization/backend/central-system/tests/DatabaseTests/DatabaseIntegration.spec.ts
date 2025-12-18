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

import { SequelizeDatabase } from '../../src/lib/database/SequelizeDatabase';
import { db } from '../../dist/lib/database/Database.js';

describe('Database - integration (seed verification)', () => {
  let database: SequelizeDatabase;

  // beforeAll(async () => {
  //   if ((process.env.DB_SEED ?? 'false') !== 'true') {
  //     throw new Error('DB_SEED must be true for DB integration tests');
  //   }

  //   database = new SequelizeDatabase({
  //     host: process.env.DB_HOST ?? 'database',
  //     port: Number(process.env.DB_PORT ?? 3306),
  //     username: process.env.DB_USER ?? 'central-system',
  //     password: process.env.DB_PASSWORD ?? 'cern',
  //     database: process.env.DB_NAME ?? 'tokenization',
  //     charset: 'utf8mb4',
  //     collate: 'utf8mb4_unicode_ci',
  //     timezone: process.env.DB_TZ ?? '+00:00',
  //     logging: (msg: any) => console.log(msg),
  //   });

  //   await database.connect();
  //   await database.migrate();
  //   await database.seed();
  // }, 60000);

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
