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

import { strictEqual, ok, rejects, deepEqual, deepStrictEqual } from 'node:assert';
import { suite, test, beforeEach, afterEach } from 'node:test';
import sinon from 'sinon';
import { sequelizeDatabase } from '../../../lib/database/index.js';

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
      const dbConfigStub = sandbox.stub(sequelizeDatabase, 'dbConfig').value(undefined);

      const testDatabase = new sequelizeDatabase.constructor();

      strictEqual(testDatabase.dbConfig.host, process.env.DATABASE_HOST ?? 'localhost', 'Incorrect default host');
      strictEqual(testDatabase.dbConfig.port, 3306, 'Default port should be 3306');
      strictEqual(testDatabase.dbConfig.username, 'cern', 'Default username should be cern');
      strictEqual(testDatabase.dbConfig.password, 'cern', 'Default password should be cern');

      dbConfigStub.restore();
    });

    test('should successfully connect to the database', async () => {
      const authenticateStub = sandbox.stub(sequelizeDatabase.sequelize, 'authenticate').resolves();
      await sequelizeDatabase.connect();
      ok(authenticateStub.calledOnce, 'Sequelize authenticate should be called once');
    });

    test('should retry connection on failure and eventually succeed', async () => {
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

    test('should throw an error after max retries', async () => {
      const { maxRetries } = sequelizeDatabase.dbConfig;

      sandbox.stub(sequelizeDatabase.sequelize, 'authenticate').rejects(new Error('Connection failed'));
      const handleConnectionErrorStub = sandbox.stub(sequelizeDatabase, '_handleConnectionError');
      const errorMessageStub = sandbox.stub(sequelizeDatabase._logger, 'errorMessage');
      await sequelizeDatabase.connect();
      ok(
        handleConnectionErrorStub.callCount === maxRetries,
        'Handle connection error should be called the correct number of times',
      );
      ok(
        errorMessageStub.calledOnceWithExactly(`Max retries (${maxRetries}) reached. Connection failed.`),
        'Error message should be logged after max retries',
      );
    });

    test('should execute migrations successfully', async () => {
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
