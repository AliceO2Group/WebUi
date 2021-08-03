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

const MySQL = require('../db/mysql.js');
const sinon = require('sinon');
const assert = require('assert');
const AssertionError = require('assert').AssertionError;

let db = null;

describe('MySQL Data Connector', () => {
  before(() => {
  });

  describe('MySQL Constructor Tests', () => {
    it('should throw error due to missing configuration', () => {
      assert.throws(() => {
        new MySQL();
      }, new AssertionError({message: 'Missing config', expected: true, operator: '=='}));
    });

    it('should throw error due to missing configuration parameter: host', () => {
      assert.throws(() => {
        new MySQL({});
      }, new AssertionError({message: 'Missing config value: mysql.host', expected: true, operator: '=='}));
    });

    it('should throw error due to missing configuration parameter: user', () => {
      assert.throws(() => {
        new MySQL({host: 'test'});
      }, new AssertionError({message: 'Missing config value: mysql.user', expected: true, operator: '=='}));
    });

    it('should throw error due to missing configuration parameter: database', () => {
      assert.throws(() => {
        new MySQL({host: 'test', user: 'test'});
      }, new AssertionError({message: 'Missing config value: mysql.database', expected: true, operator: '=='}));
    });

    it('should successfully initialize mysql connector with all parameters', () => {
      const config = {
        host: 'localhost',
        user: 'test',
        database: 'db',
        port: 8080,
        password: 'admin',
        timeout: 2020
      };
      db = new MySQL(config);
    });

    it('should successfully initialize mysql connector with mandatory parameters only', () => {
      const config = {
        host: 'localhost',
        user: 'test',
        database: 'db',
      };
      db = new MySQL(config);
    });
  });

  describe('MySQL testConnection', async () => {
    beforeEach(() => {
      const config = {
        host: 'localhost',
        user: 'test',
        database: 'db'
      };
      db = new MySQL(config);
    });

    it('should successfully test connection to the pool created', () => {
      const connection = {release: sinon.fake.returns(true)};
      const callback = sinon.fake.yields(null, connection);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.doesNotReject(async () => await db.testConnection());
    });

    it('should throw an error due to database not found', () => {
      const error = new Error();
      error.code = 'ER_NO_DB_ERROR';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.rejects(async () => await db.testConnection(), new Error('db database not found'));
    });

    it('should throw an error due to table in database not found', () => {
      const error = new Error();
      error.code = 'ER_NO_SUCH_TABLE';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.rejects(async () => await db.testConnection(), new Error('Table not found in db'));
    });

    it('should throw an error due to timeout connecting to mysql', () => {
      const error = new Error();
      error.code = 'ETIMEDOUT';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.rejects(async () =>
        await db.testConnection(), new Error('Unable to connect to mysql on localhost:3306'));
    });

    it('should throw an error due to user privileges', () => {
      const error = new Error();
      error.code = 'ER_ACCESS_DENIED_ERROR';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.rejects(async () => await db.testConnection(), new Error('Access denied for test'));
    });

    it('should throw an error due unidentified error', () => {
      const error = new Error('Test message');
      error.code = 'ER_RANDOM_ERROR';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'getConnection', callback);
      return assert.rejects(async () =>
        await db.testConnection(), new Error('MySQL error: ER_RANDOM_ERROR, Test message'));
    });
    after(() => {
      db.close();
    });
  });

  describe('MySql Query on pool', async () => {
    beforeEach(() => {
      const config = {
        host: 'localhost',
        user: 'test',
        database: 'db'
      };
      db = new MySQL(config);
    });

    it('should successfully query', () => {
      const connection = {release: sinon.fake.returns(true)};
      const callback = sinon.fake.yields(null, connection);

      sinon.replace(db.pool, 'query', ({}, callback));
      return assert.doesNotReject(async () => await db.query());
    });

    it('should throw an error due to issues while querying', () => {
      const error = new Error('Test message');
      error.code = 'ER_RANDOM_ERROR';
      const callback = sinon.fake.yields(error, null);

      sinon.replace(db.pool, 'query', callback);
      return assert.rejects(async () => await db.query(), new Error('MySQL error: ER_RANDOM_ERROR, Test message'));
    });

    after(() => {
      db.close();
    });
  });
});
