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

import { Umzug } from 'umzug';
import { Sequelize } from 'sequelize';

/**
 * Creates a new Umzug instance for managing database migrations.
 * @param {Sequelize} sequelize The Sequelize instance.
 * @param {string} migrationsDirectory The directory where migration files are located.
 * @param {string} storage The storage option for Umzug (e.g., 'sequelize' or 'json').
 * @returns {Umzug} The configured Umzug instance.
 */
export const createUmzug = (sequelize, migrationsDirectory, storage) =>
  new Umzug({
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
          up: async () => (await loadMigration()).up(context.getQueryInterface(), Sequelize),
          down: async () => (await loadMigration()).down(context.getQueryInterface(), Sequelize),
        };
      },
    },
    context: sequelize,
    storage,
  });
