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
const { processPreparedSQLStatement } = require('../../../lib/utils/preparedStatementParser.js');

describe('preparedStatementParser() - test suite', () => {
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

  it('should be able to fill in a prepared statement', async () => {
    const requestedRows = 'SELECT * FROM `messages` WHERE `timestamp`>=? AND `timestamp`<=? AND `hostname` = ? '
            + 'AND NOT(`hostname` = ? AND `hostname` IS NOT NULL) AND `severity` IN (?) ORDER BY `TIMESTAMP` LIMIT 10';
    const values = [
      '1563794601.351',
      '1563794661.354',
      'test',
      'testEx',
      [
        'D',
        'W',
      ],
    ];
    const sqlProcessedResult = processPreparedSQLStatement(requestedRows, values, 10);
    const expectedSqlResult = "SELECT * FROM `messages` WHERE `timestamp`>='1563794601.351' AND `timestamp`" +
            "<='1563794661.354' AND `hostname` = 'test' AND NOT(`hostname` = 'testEx' AND `hostname` IS NOT" +
            " NULL) AND `severity` IN ('D','W') ORDER BY `TIMESTAMP` LIMIT 10";
    assert.strictEqual(sqlProcessedResult, expectedSqlResult);
  });

  it('should log every executed sql query as debug', async () => {
    const sqlDataSource = new QueryService(config.mysql);
    sqlDataSource._logger = {
      debugMessage: sinon.stub(),
    };
    sqlDataSource._pool = {
      query: sinon.stub().resolves([{ hostname: 'test', severity: 'W' }]),
    };
    await sqlDataSource.queryFromFilters(realFilters, { limit: 10 });
    const completeSqlQuery = "SELECT * FROM `messages` WHERE `timestamp`>='1563794601.351' AND" +
            " `timestamp`<='1563794661.354' AND `hostname` = 'test' AND NOT(`hostname` = 'testEx' AND" +
            " `hostname` IS NOT NULL) AND `severity` IN ('D','W') ORDER BY `TIMESTAMP` LIMIT 10;";
    assert.strictEqual(sqlDataSource._logger.debugMessage.calledWith(`SQL to execute: ${completeSqlQuery}`), true);
  });
});
