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

/**
 * Initializes the database connection and runs migrations.
 * @param {object} sequelizeDatabase - The Sequelize database instance.
 * @returns {Promise<void>} A promise that resolves when the database is initialized.
 */
export const initDatabase = async (sequelizeDatabase) => {
  const _logger = LogManager.getLogger('qcg/database');
  try {
    await sequelizeDatabase.connect();
    await sequelizeDatabase.migrate();
  } catch (error) {
    _logger.errorMessage(`Failed to initialize database: ${error.message}`);
  }
};
