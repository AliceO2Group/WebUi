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

import { SequelizeDatabase } from './SequelizeDatabase.js';
import { LogManager } from '@aliceo2/web-ui';

// Database class to create and manage the database connection
class Database {
  /**
   * Creates and initializes the database connection.
   * @param config - Database configuration object.
   * @returns Initialized SequelizeDatabase instance.
   */
  public static async createDatabase(
    config: object
  ): Promise<SequelizeDatabase> {
    const database = new SequelizeDatabase(config);

    await database.connect();
    await database.migrate();
    if ((process.env.DB_SEED ?? 'false') === 'true') {
      await database.seed();
    }

    return database;
  }
}

const logger = LogManager.getLogger('Database');

export const db = await Database.createDatabase({
  host: process.env.DB_HOST ?? 'database',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'central-system',
  password: process.env.DB_PASSWORD ?? 'cern',
  database: process.env.DB_NAME ?? 'tokenization',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  timezone: process.env.DB_TZ ?? '+00:00',
  logging: process.env.DB_LOGGING ?? false,
});
