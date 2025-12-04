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

import { SequelizeDatabaseConfig } from './sequelizeDatabaseConfig.js';

/**
 * Returns database configuration with default values if not provided.
 * @param config - Partial database configuration object.
 * @returns Complete database configuration object.
 */
export function getConfig(
  config?: Partial<SequelizeDatabaseConfig>
): SequelizeDatabaseConfig {
  const c = config ?? {};
  return {
    host: c.host ?? 'localhost',
    port: c.port ?? 3306,
    username: c.username ?? 'cern',
    password: c.password ?? 'cern',
    database: c.database ?? 'tkn',
    charset: c.charset ?? 'utf8mb4',
    collate: c.collate ?? 'utf8mb4_general_ci',
    timezone: c.timezone ?? '+00:00',
    logging: c.logging ?? false,
    retryThrottle: c.retryThrottle ?? 5000,
  };
}
