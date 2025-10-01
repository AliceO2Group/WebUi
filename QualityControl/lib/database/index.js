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

import { LogManager } from '@aliceo2/web-ui';
import { isRunningInDevelopment, isRunningInProduction, isRunningInTest } from '../utils/environment.js';

const LOG_FACILITY = `${process.env.npm_config_log_label ?? 'qcg'}/database`;

/**
 * Initializes the database connection and runs migrations.
 * @param {object} sequelizeDatabase - The Sequelize database instance.
 * @param root0
 * @param root0.forceSeed
 * @param root0.drop
 * @returns {Promise<void>} A promise that resolves when the database is initialized.
 */
export const initDatabase = async (sequelizeDatabase, { forceSeed = false, drop = false }) => {
  const _logger = LogManager.getLogger(LOG_FACILITY);
  try {
    if (isRunningInTest) {
      await sequelizeDatabase.dropAllTables();
      await sequelizeDatabase.migrate();
      await sequelizeDatabase.seed();
    } else if (isRunningInDevelopment) {
      if (drop) {
        await sequelizeDatabase.dropAllTables();
      }
      await sequelizeDatabase.migrate();
      if (forceSeed) {
        await sequelizeDatabase.seed();
      }
    } else if (isRunningInProduction) {
      await sequelizeDatabase.migrate();
    }
  } catch (error) {
    _logger.errorMessage(`Failed to initialize database: ${error.message}`);
  }
};
