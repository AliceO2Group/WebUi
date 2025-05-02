/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file 'COPYING'.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

/**
 * Returns a normalized database configuration object.
 * @param {object} config - Custom config defined in the config file.
 * @returns {object} Normalized database configuration.
 */
export function getDbConfig(config) {
  return {
    host: config.host ?? 'localhost',
    port: config.port ?? 3306,
    username: config.username ?? 'cern',
    password: config.password ?? 'cern',
    database: config.database ?? 'qcg',
    charset: config.charset ?? 'utf8mb4',
    collate: config.collate ?? 'utf8mb4_general_ci',
    timezone: config.timezone ?? '+00:00',
    logging: config.logging ?? false,
    retryThrottle: config.retryThrottle ?? 5000,
    migrationSeed: config.migrationSeed ?? false,
  };
};
