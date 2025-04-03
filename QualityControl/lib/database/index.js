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
import { SequelizeStorage, Umzug } from 'umzug';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Sequelize implementation of the Database.
 */
export class SequelizeDatabase {
  constructor(config = {}) {
    this._logger = LogManager.getLogger('qcg/database');

    if (typeof config !== 'object' || config === null) {
      this._logger.warnMessage('Invalid database configuration provided. Using default configuration.');
      config = {}; // Evitar errores en la asignación de configuración
    }

    const env = process?.env ?? {};

    this.dbconfig = {
      host: env.DATABASE_HOST || 'localhost',
      port: config.port || 3306,
      username: config.username || 'cern',
      password: config.password || 'cern',
      database: `qcg${env.NODE_ENV === 'test' ? '_test' : ''}`,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
      timezone: '+00:00',
      logging: config.logging ?? false,
      maxRetries: config.maxRetries ?? 5,
      retryThrottle: config.retryThrottle ?? 5000,
      ...config,
    };

    const __filename = fileURLToPath(import.meta.url);
    this.__dirname = dirname(__filename);

    try {
      this.sequelize = new Sequelize(
        this.dbconfig.database,
        this.dbconfig.username,
        this.dbconfig.password,
        {
          host: this.dbconfig.host,
          port: this.dbconfig.port,
          dialect: 'mariadb',
          dialectOptions: {
            charset: this.dbconfig.charset,
            collate: this.dbconfig.collate,
            timezone: this.dbconfig.timezone,
          },
          logging: this.dbconfig.logging,
          define: {
            underscored: true,
          },
        },
      );
      this._logger.infoMessage('Database connection initialized successfully.');
    } catch (error) {
      this._logger.errorMessage('Error initializing database connection:', error);
      throw new Error('Database connection failed');
    }
  }

  async connect() {
    const { maxRetries, retryThrottle } = this.dbconfig;
    let attemptCount = 0;

    while (attemptCount < maxRetries) {
      try {
        await this.sequelize.authenticate();
        this._logger.debugMessage('Connected to db successfully)');
        return;
      } catch (error) {
        attemptCount++;
        this._handleConnectionError(error, attemptCount, maxRetries, retryThrottle);
      }
    }
    throw new Error(`Max retries (${maxRetries}) reached. Connection failed.`);
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
 * Initializes the database by connecting, migrating, and seeding data in test and development environments.
 * @param {SequelizeDatabase} sequelizeDatabase - The Sequelize database instance.
 */
export const initDatabase = async (sequelizeDatabase) => {
  try {
    await sequelizeDatabase.connect();
    await sequelizeDatabase.migrate();
  } catch {
    process.exit(1);
  }
};
