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

import pkg, { SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import { LogManager } from '@aliceo2/web-ui';
import { MigrationParams } from 'umzug';

const { Umzug } = pkg;
const logger = LogManager.getLogger('database/umzug');

export const createUmzug = (
  sequelize: Sequelize,
  migrationsDirectory: string,
  storage: SequelizeStorage
) =>
  new Umzug({
    migrations: {
      glob: `${migrationsDirectory}/*.{mjs,mts}`,
      resolve: ({
        name,
        path: migrationPath,
        context,
      }: MigrationParams<Sequelize>) => {
        const loadMigration = async () => {
          if (!migrationPath) {
            throw new Error(`Missing migration path for '${name}'`);
          }
          const migration = await import(migrationPath);
          if (
            typeof migration.up !== 'function' ||
            typeof migration.down !== 'function'
          ) {
            throw new Error(
              `Migration '${name}' is missing valid up/down functions.`
            );
          }
          return migration;
        };

        return {
          name,
          up: async () =>
            (await loadMigration()).up(context.getQueryInterface(), Sequelize),
          down: async () =>
            (await loadMigration()).down(
              context.getQueryInterface(),
              Sequelize
            ),
        };
      },
    },
    context: sequelize,
    storage,
    logger: logger,
  });
