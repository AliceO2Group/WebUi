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
const { processPreparedSQLStatement } = require('../../../lib/utils/preparedStatementParser.js');

describe('preparedStatementParser() - test suite', () => {
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
});
