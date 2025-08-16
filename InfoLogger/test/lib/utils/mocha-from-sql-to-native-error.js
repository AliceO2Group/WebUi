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
/* eslint-disable @stylistic/js/max-len */

const assert = require('assert');
const { NotFoundError, TimeoutError, UnauthorizedAccessError } = require('@aliceo2/web-ui');
const { fromSqlToNativeError } = require('../../../lib/utils/fromSqlToNativeError.js');

describe('fromSqlToNativeError', () => {
  it('should throw NotFoundError for ER_NO_DB_ERROR', () => {
    const error = { code: 'ER_NO_DB_ERROR', errno: 1049, sqlMessage: 'Unknown database' };
    assert.throws(() => fromSqlToNativeError(error), NotFoundError);
  });

  it('should throw NotFoundError for ER_NO_SUCH_TABLE', () => {
    const error = { code: 'ER_NO_SUCH_TABLE', errno: 1146, sqlMessage: 'Table does not exist' };
    assert.throws(() => fromSqlToNativeError(error), NotFoundError);
  });

  it('should throw TimeoutError for ER_STATEMENT_TIMEOUT', () => {
    const error = { code: 'ER_STATEMENT_TIMEOUT', errno: 3024, sqlMessage: 'Statement timeout' };
    assert.throws(() => fromSqlToNativeError(error), TimeoutError);
  });

  it('should throw UnauthorizedAccessError for ER_ACCESS_DENIED_ERROR', () => {
    const error = { code: 'ER_ACCESS_DENIED_ERROR', errno: 1045, sqlMessage: 'Access denied' };
    assert.throws(() => fromSqlToNativeError(error), UnauthorizedAccessError);
  });

  it('should throw generic Error for unknown error code', () => {
    const error = { code: 'UNKNOWN_ERROR', errno: 9999, sqlMessage: 'Unknown error' };
    assert.throws(() => fromSqlToNativeError(error), Error);
  });
});