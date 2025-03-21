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

import { deepStrictEqual, ok, rejects, strictEqual } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { SequelizeDatabase } from '../../../lib/database/index.js';
import { config } from '../../config.js';

export const sequelizeDatabaseTestSuite = async () => {
  suite('SequelizeDatabase Tests', () => {
    let sandbox = null;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
    });

    afterEach(() => {
      sandbox.restore();
    });

    test('should set default values if database config is not provided', () => {
      const sequelizeDatabase = new SequelizeDatabase({});
      const { host, port, username, password, database } = sequelizeDatabase.dbConfig;
      strictEqual(host, process.env.DATABASE_HOST ?? 'localhost', 'Incorrect default host');
      strictEqual(port, 3306, 'Default port should be 3306');
      strictEqual(username, 'cern', 'Default username should be cern');
      strictEqual(password, 'cern', 'Default password should be cern');
      strictEqual(database, 'qcg_test', 'Default database should be qcg_test');
    });

    test('should successfully connect to the database', async () => {
      const sequelizeDatabase = new SequelizeDatabase(config.database);
      const authenticateStub = sandbox.stub(sequelizeDatabase.sequelize, 'authenticate').resolves();
      await sequelizeDatabase.connect();
      ok(authenticateStub.calledOnce, 'Sequelize authenticate should be called once');
    });

    test('should retry connection on failure and eventually succeed', async () => {
      const sequelizeDatabase = new SequelizeDatabase(config.database);
      const authenticateStub = sandbox
        .stub(sequelizeDatabase.sequelize, 'authenticate')
        .onFirstCall()
        .rejects(new Error('Connection failed'))
        .onSecondCall()
        .resolves();

      const loggerStub = sandbox.stub(sequelizeDatabase._logger, 'debugMessage');

      await sequelizeDatabase.connect();

      strictEqual(authenticateStub.callCount, 2, 'Sequelize authenticate should be called twice');
      ok(loggerStub.calledWithMatch(/Retrying in/), 'Logger should log retry messages');
    });

    test('should execute migrations successfully', async () => {
      const sequelizeDatabase = new SequelizeDatabase(config.database);
      const umzugStub = {
        up: sandbox.stub().resolves(),
      };
      const getUmzugStub = sandbox.stub(sequelizeDatabase, 'getUmzug').returns(umzugStub);
      const loggerStub = sandbox.stub(sequelizeDatabase._logger, 'infoMessage');

      await sequelizeDatabase.migrate();

      ok(getUmzugStub.calledOnce, 'getUmzug should be called once');
      ok(umzugStub.up.calledOnce, 'Umzug up should be called once');
      ok(loggerStub.calledWithMatch(/Migrations completed successfully/), 'Logger should log migration success');
    });

    test('should log error if migrations fail', async () => {
      const sequelizeDatabase = new SequelizeDatabase(config.database);
      const umzugStub = {
        up: sandbox.stub().rejects(new Error('Migration failed')),
      };
      const getUmzugStub = sandbox.stub(sequelizeDatabase, 'getUmzug').returns(umzugStub);
      const loggerStub = sandbox.stub(sequelizeDatabase._logger, 'errorMessage');

      await rejects(
        sequelizeDatabase.migrate(),
        /Migration failed/,
        'Should throw an error if migrations fail',
      );

      ok(getUmzugStub.calledOnce, 'getUmzug should be called once');
      ok(umzugStub.up.calledOnce, 'Umzug up should be called once');
      ok(loggerStub.calledWithMatch(/Error executing migrations/), 'Logger should log migration error');
    });

    test('should create all required tables after migrations', async () => {
      const sequelizeDatabase = new SequelizeDatabase(config.database);

      const loggerStub = sandbox.stub(sequelizeDatabase._logger, 'infoMessage');
      await sequelizeDatabase.migrate();

      const tables = await sequelizeDatabase.sequelize.getQueryInterface().showAllTables();

      const expectedTableNames =
        ['chart_options', 'charts', 'grid_tab_cells', 'layouts', 'options', 'sequelize_meta', 'tabs', 'users'];

      const tableNames = tables.sort().map((table) => table.tableName);

      deepStrictEqual(
        tableNames.sort(),
        expectedTableNames.sort(),
        'DB tables are not created as expected',
      );

      expectedTableNames.forEach((tableName) => {
        ok(tableNames.includes(tableName), `Table "${tableName}" was not created.`);
      });

      // Restore the logger stub
      loggerStub.restore();
    });
  });
};
