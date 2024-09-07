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

const { NotFoundError, TimeoutError, UnauthorizedAccessError } = require('@aliceo2/web-ui');

/**
 * The purpose is to translate MySQL errors to native JS errors
 * Source: https://github.com/mariadb-corporation/mariadb-connector-nodejs/blob/c3a9e333243a1d92b22f4ca1e5a574ab0de77cea/lib/const/error-code.js#L1040
 * @param {SqlError} error - the error from a catch or callback
 * @throws throws a native JS error
 */
const fromSqlToNativeError = (error) => {
  const { code, errno, sqlMessage } = error;
  const errorMessage = `SQL: [${code}, ${errno}] ${sqlMessage}`;
  switch (code) {
    case 'ER_NO_DB_ERROR':
      throw new NotFoundError(errorMessage);
    case 'ER_NO_SUCH_TABLE':
      throw new NotFoundError(errorMessage);
    case 'ER_STATEMENT_TIMEOUT':
      throw new TimeoutError(errorMessage);
    case 'ER_ACCESS_DENIED_ERROR':
      throw new UnauthorizedAccessError(errorMessage);
    default:
      throw new Error(errorMessage);
  }
};

module.exports.fromSqlToNativeError = fromSqlToNativeError;
