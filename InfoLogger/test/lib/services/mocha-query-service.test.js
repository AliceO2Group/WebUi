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

const assert = require('assert');
const sinon = require('sinon');
const config = require('../../../config-default.js');
const { QueryService } = require('../../../lib/services/QueryService.js');
const { UnauthorizedAccessError, TimeoutError } = require('@aliceo2/web-ui');

describe(`'QueryService' test suite`, () => {
  const filters = {
    timestamp: {
      since: -5,
      until: -1,
      $since: '2019-07-22T11:23:21.351Z',
      $until: '2019-07-22T11:24:21.354Z',
    },
    hostname: {
      match: 'test',
      exclude: 'testEx',
      $match: 'test',
      $exclude: 'testEx',
    },
    severity: {
      in: 'D I',
      $in: ['D', 'W'],
    },
    level: {
      max: 21, // 0, 1, 6, 11, 21
      $max: 21, // 0, 1, 6, 11, 21
    },
    pid: {
      $maxWrong: 22,
    },
    userId: {
      min: 10,
      $min: 10,
    },
  };

  const realFilters = {
    timestamp: {
      since: -5,
      until: -1,
      $since: '2019-07-22T11:23:21.351Z',
      $until: '2019-07-22T11:24:21.354Z',
    },
    hostname: {
      match: 'test',
      exclude: 'testEx',
      $match: 'test',
      $exclude: 'testEx',
    },
    severity: {
      in: 'D I',
      $in: ['D', 'W'],
    },
    level: {
      max: null, // 0, 1, 6, 11, 21
      $max: null, // 0, 1, 6, 11, 21
    },
  };
  const emptySqlDataSource = new QueryService(undefined, {});

  describe(`'checkConnection()' - test suite`, () => {
    it('should reject with error when simple query fails', async () => {
      const sqlDataSource = new QueryService(config.mysql);
      sqlDataSource._isAvailable = true;
      sqlDataSource._pool = {
        query: sinon.stub().rejects({
          code: 'ER_ACCESS_DENIED_ERROR',
          errno: 1045,
          sqlMessage: 'Access denied',
        }),
      };

      await assert.rejects(
        sqlDataSource.checkConnection(),
        new UnauthorizedAccessError('SQL: [ER_ACCESS_DENIED_ERROR, 1045] Access denied'),
      );
      assert.ok(sqlDataSource.isAvailable === false);
    });

    it('should do nothing when checking connection with mysql driver and driver returns resolved Promise', async () => {
      const sqlDataSource = new QueryService(config.mysql);
      sqlDataSource._isAvailable = false;
      sqlDataSource._pool = {
        query: sinon.stub().resolves(),
      };

      await assert.doesNotReject(sqlDataSource.checkConnection());
      assert.ok(sqlDataSource.isAvailable);
    });
  });

  describe('Filter to SQL Conditions', () => {
    it('should successfully return empty values & criteria when translating empty filters from client', () => {
      assert.deepStrictEqual(emptySqlDataSource._filtersToSqlConditions({}), { values: [], criteria: [] });
    });

    it('should successfully return values & criteria when translating filters from client', () => {
      const expectedValues = [1563794601.351, 1563794661.354, 'test', 'testEx', ['D', 'W'], 21, 22, 10];
      const expectedCriteria = [
        '`timestamp`>=?',
        '`timestamp`<=?',
        '`hostname` = ?',
        'NOT(`hostname` = ? AND `hostname` IS NOT NULL)',
        '`severity` IN (?)',
        '`level`<=?',
        '`userId`>=?',
      ];
      assert.deepStrictEqual(
        emptySqlDataSource._filtersToSqlConditions(filters),
        { values: expectedValues, criteria: expectedCriteria },
      );
    });
    it('should successfully return values & criteria when translating filters from client (2)', () => {
      const likeFilters = filters;
      likeFilters.hostname = { match: 'test%', exclude: 'testEx', $match: 'test%', $exclude: 'testEx' };
      const expectedValues = [1563794601.351, 1563794661.354, 'test%', 'testEx', ['D', 'W'], 21, 22, 10];
      const expectedCriteria = [
        '`timestamp`>=?',
        '`timestamp`<=?',
        '`hostname` LIKE (?)',
        'NOT(`hostname` = ? AND `hostname` IS NOT NULL)',
        '`severity` IN (?)',
        '`level`<=?',
        '`userId`>=?',
      ];
      assert.deepStrictEqual(
        emptySqlDataSource._filtersToSqlConditions(likeFilters),
        { values: expectedValues, criteria: expectedCriteria },
      );
    });
    it('should successfully build query when excluding multiple hostnames', () => {
      const likeFilters = filters;
      likeFilters.hostname = { $exclude: 'test testEx', exclude: 'test testEx' };
      const expectedValues = [1563794601.351, 1563794661.354, 'test', 'testEx', ['D', 'W'], 21, 22, 10];
      const expectedCriteria = [
        '`timestamp`>=?',
        '`timestamp`<=?',
        'NOT(`hostname` = ? AND `hostname` IS NOT NULL OR `hostname` = ? AND `hostname` IS NOT NULL)',
        '`severity` IN (?)',
        '`level`<=?',
        '`userId`>=?',
      ];
      assert.deepStrictEqual(
        emptySqlDataSource._filtersToSqlConditions(likeFilters),
        { values: expectedValues, criteria: expectedCriteria },
      );
    });
  });

  describe('Parse criteria as SQL Query', () => {
    it('should successfully return empty string for criteria if array is empty', () => {
      assert.deepStrictEqual(emptySqlDataSource._getCriteriaAsString([]), '');
    });

    it('should successfully return empty string for criteria if array is undefined', () => {
      assert.deepStrictEqual(emptySqlDataSource._getCriteriaAsString(undefined), '');
    });

    it('should successfully return empty string for criteria if array is null', () => {
      assert.deepStrictEqual(emptySqlDataSource._getCriteriaAsString(null), '');
    });

    it('should successfully return SQL format criteria if array contains values', () => {
      const criteria = [
        '`timestamp`>=?',
        '`timestamp`<=?',
        '`hostname` = ?',
        'NOT(`hostname` = ? AND `hostname` IS NOT NULL)',
        '`severity` IN (?)',
      ];
      const expectedCriteriaString = 'WHERE `timestamp`>=? AND `timestamp`<=? AND ' +
        '`hostname` = ? AND NOT(`hostname` = ? AND `hostname` IS NOT NULL) AND `severity` IN (?)';
      assert.deepStrictEqual(emptySqlDataSource._getCriteriaAsString(criteria), expectedCriteriaString);
    });
  });

  describe('queryFromFilters() - test suite', () => {
    it('should throw an error when unable to query(API) due to rejected promise', async () => {
      const sqlDataSource = new QueryService(config.mysql);
      sqlDataSource._pool = {
        query: sinon.stub().rejects({
          code: 'ER_ACCESS_DENIED_ERROR',
          errno: 1045,
          sqlMessage: 'Access denied',
        }),
      };
      await assert.rejects(
        sqlDataSource.queryFromFilters(realFilters, { limit: 10 }),
        new UnauthorizedAccessError('SQL: [ER_ACCESS_DENIED_ERROR, 1045] Access denied'),
      );
    });

    it('should successfully return result when filters are provided for querying', async () => {
      const query = 'SELECT * FROM `messages` WHERE `timestamp`>=? AND `timestamp`<=? AND `hostname` = ? '
        + 'AND NOT(`hostname` = ? AND `hostname` IS NOT NULL) AND `severity` IN (?) ORDER BY `TIMESTAMP` LIMIT 10';

      const sqlDataSource = new QueryService(config.mysql);
      sqlDataSource._pool = {
        query: sinon.stub().resolves([
          { hostname: 'test', severity: 'W' },
          { hostname: 'test', severity: 'I' },
        ]),
      };
      const result = await sqlDataSource.queryFromFilters(realFilters, { limit: 10 });
      delete result.time;

      const expectedResult = {
        rows: [
          { hostname: 'test', severity: 'W' },
          { hostname: 'test', severity: 'I' },
        ],
        count: 2,
        limit: 10,
        queryAsString: query,
      };
      assert.deepStrictEqual(result, expectedResult);
    });
  });

  describe('queryGroupCountLogsBySeverity() - test suite', ()=> {
    it(`should successfully return stats when queried for all known severities
      even if none is some are not returned by data service`, async () => {
      const dataService = new QueryService(config.mysql);
      dataService._pool = {
        query: sinon.stub().resolves([
          { severity: 'E', 'COUNT(*)': 102 },
          { severity: 'F', 'COUNT(*)': 1 },
        ]),
      };
      const data = await dataService.queryGroupCountLogsBySeverity(51234);
      assert.deepStrictEqual(data, {
        D: 0,
        I: 0,
        W: 0,
        E: 102,
        F: 1,
      });
    });

    it('should throw error if data service throws SQL', async () => {
      const dataService = new QueryService(config.mysql);
      dataService._pool =
        {
          query: sinon.stub().rejects({
            code: 'ER_ACCESS_DENIED_ERROR',
            errno: 1045,
            sqlMessage: 'Access denied',
          }),
        };

      await assert.rejects(
        dataService.queryGroupCountLogsBySeverity(51234),
        new UnauthorizedAccessError('SQL: [ER_ACCESS_DENIED_ERROR, 1045] Access denied'),
      );

      dataService._pool = {
        query: sinon.stub().rejects({
          code: 'ER_STATEMENT_TIMEOUT',
          errno: 1045,
          sqlMessage: 'query timed out',
        }),
      };
      await assert.rejects(
        dataService.queryGroupCountLogsBySeverity(51234),
        new TimeoutError('SQL: [ER_STATEMENT_TIMEOUT, 1045] query timed out'),
      );
    });
  });
});
