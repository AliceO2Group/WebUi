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

/**
 * Translate the SQL prepared statement to a regular SQL query.
 * @param {string} requestRows The prepared SQL statement.
 * @param {any} values Values for the prepared SQL statement.
 * @param {number} limit Configured limit of the sql query results.
 * @returns {string} the resulting SQL query as a string.
 */
function processPreparedSQLStatement(requestRows, values, limit) {
  let sqlQuery = requestRows;

  const iterator = values.values();
  for (const value of iterator) {
    if (Array.isArray(value)) {
      sqlQuery = sqlQuery.replace('?', convertArrayToString(value));
    } else {
      sqlQuery = sqlQuery.replace('?', `'${value}'`);
    }
  }
  sqlQuery = sqlQuery.replace('?', limit);

  return sqlQuery;
}

/**
 * Helper function that converts arrays to strings with a single quote around the values.
 * This function can later be expanded to handle values other than strings in the array.
 * @param {Array} array Array to convert to string.
 * @returns {string} a string representation of the input array.
 */
function convertArrayToString(array) {
  let processedArray = '';
  array.forEach((v) => {
    if (typeof v == 'string') {
      processedArray += `'${v}',`;
    }
  });
  processedArray = processedArray.substring(0, processedArray.length - 1);
  return processedArray;
}

module.exports.processPreparedSQLStatement = processPreparedSQLStatement;
