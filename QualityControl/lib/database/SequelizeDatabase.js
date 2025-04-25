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
import { Sequelize } from 'sequelize';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createUmzug } from './umzug.js';
import { getDbConfig } from '../config/database.js';
import models from './models/index.js';
import { SequelizeStorage } from 'umzug';

/**
 * Sequelize implementation of the Database.
 */
export class SequelizeDatabase {
  constructor(config) {
    this._logger = LogManager.getLogger('qcg/database');

    if (!config) {
      this._logger.warnMessage('No configuration provided for SequelizeDatabase. Using default configuration.');
    }
    this._dbConfig = getDbConfig(config);
    const {
      database,
      username,
      password,
      host,
      port,
      charset,
      collate,
      timezone,
      logging,
    } = this._dbConfig;

    this.sequelize = new Sequelize(
      database,
      username,
      password,
      {
        host,
        port,
        dialect: 'mariadb',
        dialectOptions: {
          charset,
          collate,
          timezone,
        },
        logging,
        define: {
          underscored: true,
        },
      },
    );
    this._models = models(this.sequelize);
    this._logger.infoMessage('Database connection initialized successfully.');
  }

  /**
   * Establishes a connection to the database using Sequelize.
   * @returns {Promise<void>} Resolves once the connection is successfully established.
   */
  async connect() {
    const { retryThrottle } = this._dbConfig;
    let connected = false;

    while (!connected) {
      try {
        await this.sequelize.authenticate();
        connected = true;
        this._logger.infoMessage(`Successfully connected to database 
          '${this._dbConfig.database}' on '${this._dbConfig.host}:${this._dbConfig.port}'`);
      } catch (error) {
        this._logger.errorMessage(`Unable to connect to db: ${error}`);
        this._logger.debugMessage(`Retrying in ${retryThrottle} ms...`);
        // Wait before trying again
        await new Promise((resolve) => setTimeout(resolve, retryThrottle));
      }
    }
  }

  /**
   * Executes pending migrations.
   * @returns {Promise<void>}
   */
  async migrate() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this._logger.debugMessage('Executing pending migrations...');
    try {
      const umzug = createUmzug(
        this.sequelize,
        join(__dirname, 'migrations'),
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

  /**
   * Gets the models.
   * @returns {object} The models.
   */
  get models() {
    return this._models;
  }
}
