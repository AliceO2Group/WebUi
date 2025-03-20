/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { LogManager } from '@aliceo2/web-ui';
import { Sequelize } from 'sequelize';
import dbConfig from './config/config.js';
import { SequelizeStorage, Umzug } from 'umzug';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Sequelize implementation of the Database.
 */
class SequelizeDatabase {
  constructor() {
    this._logger = LogManager.getLogger('qcg/database');
    this.dbConfig = dbConfig;
    const {
      host,
      database,
      username,
      password,
      port,
      dialectOptions,
      logging,
    } = this.dbConfig;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.__dirname = __dirname;

    this.sequelize = new Sequelize(database, username, password, {
      host,
      port,
      dialect: 'mariadb',
      dialectOptions,
      logging,
      define: {
        underscored: true,
      },
    });
  }

  async connect() {
    const { database, host, port, maxRetries, retryThrottle } = this.dbConfig;
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      try {
        await this.sequelize.authenticate();
        this._logger.debugMessage(`Connected to db "${database}" (${host}:${port})`);
        return;
      } catch (error) {
        attemptCount++;
        this._handleConnectionError(error, attemptCount, maxRetries, retryThrottle);
      }
    }

    this._logger.errorMessage(`Max retries (${maxRetries}) reached. Connection failed.`);
  }

  _handleConnectionError(error, attemptCount, maxRetries, retryThrottle) {
    if (attemptCount === 1) {
      this._logger.errorMessage(`Error while starting QCG database connection: ${error}`);
    }
    if (attemptCount < maxRetries) {
      this._logger.debugMessage(`Retrying in ${retryThrottle} ms...`);
      setTimeout(() => {}, retryThrottle);
    }
  }

  async migrate() {
    this._logger.infoMessage('Executing pending migrations...');
    try {
      const umzug = this.getUmzug(
        join(this.__dirname, 'migrations'),
        new SequelizeStorage({
          sequelize: this.sequelize,
        }),
      );
      await umzug.up();
      this._logger.infoMessage('Migrations completed successfully.');
    } catch (error) {
      this._logger.errorMessage(`Error executing migrations: ${error}`);
      throw error;
    }
  }

  getUmzug(migrationsDirectory, storage) {
    return new Umzug({
      migrations: {
        glob: `${migrationsDirectory}/*.mjs`,
        resolve: ({ name, path: migrationPath, context }) => {
          const loadMigration = async () => {
            const migration = await import(migrationPath);
            if (typeof migration.up !== 'function' || typeof migration.down !== 'function') {
              throw new Error(`Migration "${name}" is missing valid up/down functions.`);
            }
            return migration;
          };

          return {
            name,
            up: async () => {
              const { up } = await loadMigration();
              await up(context.getQueryInterface(), Sequelize);
            },
            down: async () => {
              const { down } = await loadMigration();
              await down(context.getQueryInterface(), Sequelize);
            },
          };
        },
      },
      context: this.sequelize,
      storage,
    });
  }
}

/**
 * An instance of SequelizeDatabase
 * @constant {SequelizeDatabase} sequelizeDatabase
 */
export const sequelizeDatabase = new SequelizeDatabase();
export const { sequelize } = sequelizeDatabase;
