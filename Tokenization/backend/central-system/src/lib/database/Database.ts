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

import { SequalizeDatabase } from './SequalizeDatabase.js';

class Database {
  public static async createDatabase(
    config: object
  ): Promise<SequalizeDatabase> {
    const database = new SequalizeDatabase(config);
    await database.connect();
    await database.migrate();
    return database;
  }
}

export const db = await Database.createDatabase({
  host: process.env.DB_HOST ?? 'database',
  port: Number(process.env.DB_PORT ?? 3306),
  username: process.env.DB_USER ?? 'central-system',
  password: process.env.DB_PASSWORD ?? 'dev-password',
  database: process.env.DB_NAME ?? 'tokenization',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  timezone: process.env.DB_TZ ?? '+00:00',
  logging: process.env.DB_LOGGIN ?? false,
});
