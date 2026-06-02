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

const mariadb = require('mariadb');
const { LogManager, InvalidInputError } = require('@aliceo2/web-ui');
const { fromSqlToNativeError } = require('../utils/fromSqlToNativeError');
const { processPreparedSQLStatement } = require('../utils/preparedStatementParser');

class QueryService {
  /**
   * Query service that is to be used to map the InfoLogger parameters to SQL query and retrieve data
   * @param {object} configMySql - mysql config
   */
  constructor(configMySql = {}) {
    this._timeout = configMySql?.timeout ?? 10000;
    this._host = configMySql?.host;
    this._port = configMySql?.port;
    this._isAvailable = false;
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/query-service`);

    // Only create a connection pool if configuration is provided
    if (configMySql?.host && configMySql?.port) {
      configMySql.user = configMySql.user ?? 'gui';
      configMySql.password = configMySql.password ?? '';
      configMySql.host = configMySql.host ?? 'localhost';
      configMySql.port = configMySql.port ?? 3306;
      configMySql.database = configMySql.database ?? 'info_logger';
      configMySql.connectionLimit = configMySql.connectionLimit ?? 25;
      this._host = configMySql.host;
      this._port = configMySql.port;

      this._pool = mariadb.createPool(configMySql);
    } else {
      this._pool = null;
    }
  }

  /**
   * Method to test connection of mysql connector once initialized
   * @param {number} timeout - timeout for the connection test
   * @param {boolean} shouldThrow - whether an error should be thrown on failure
   * @returns {Promise} - a promise that resolves if connection is successful
   */
  async checkConnection(timeout = this._timeout, shouldThrow = true) {
    if (!this._pool) {
      this._isAvailable = false;
      const error = new InvalidInputError('No database configuration provided');
      if (shouldThrow) {
        throw error;
      } else {
        this._logger.errorMessage(error);
      }
      return;
    }

    try {
      await this._pool.query({
        sql: 'SELECT 1',
        timeout,
      });
      this._isAvailable = true;
      this._logger.infoMessage(`Connection to DB successfully established: ${this._host}:${this._port}`);
    } catch (error) {
      this._isAvailable = false;
      if (shouldThrow) {
        fromSqlToNativeError(error);
      } else {
        this._logger.errorMessage(error);
      }
    }
  }

  /**
   * Ask DB for a part of rows and the total count
   * - total: how many rows available (limited to 1M)
   * - more: true if has more than 1M rows
   * - limit: options.limit or 100k
   * - rows: the first `limit` rows
   * - count: how many rows inside `rows`
   * - time: how much did it take, in ms
   * @param {object} filters - criteria like MongoDB
   * @param {object} options - specific options for the query
   * @param {number} options.limit - how many rows to get
   * @returns {Promise.<object>} - {total, more, limit, rows, count, time}
   */
  async queryFromFilters(filters, options) {
    const { limit = 100000 } = options;
    const { criteria, values } = this._filtersToSqlConditions(filters);
    const criteriaString = this._getCriteriaAsString(criteria);

    const requestRows = `SELECT * FROM \`messages\` ${criteriaString} ORDER BY \`TIMESTAMP\` LIMIT ?;`;
    const startTime = Date.now(); // ms

    this._logger.debugMessage(`SQL to execute: ${processPreparedSQLStatement(requestRows, values, limit)}`);

    let rows = [];
    try {
      if (!this._pool) {
        throw new Error('No database connection available');
      }
      rows = await this._pool.query(
        {
          sql: requestRows,
          timeout: this._timeout,
        },
        [...values, limit],
      );
    } catch (error) {
      fromSqlToNativeError(error);
    }

    const totalTime = Date.now() - startTime; // ms
    return {
      rows,
      count: rows.length,
      limit: limit,
      time: totalTime, // ms
      queryAsString: this._getSQLQueryAsString(criteriaString, limit),
    };
  }

  /**
   * Given a runNumber, query logs for it and return a count of the logs grouped by severity
   * @param {number|string} runNumber - number of the run for which the query should be performed
   * @returns {Promise.<object>} - object containing the count of logs grouped by severity
   */
  async queryGroupCountLogsBySeverity(runNumber) {
    const groupByStatement =
      'SELECT severity, COUNT(*) FROM messages WHERE run=? and severity '
      + 'in (\'D\', \'I\', \'W\', \'E\', \'F\') GROUP BY severity;';
    let data = [];
    try {
      if (!this._pool) {
        throw new Error('No database connection available');
      }
      data = await this._pool.query({
        sql: groupByStatement,
        timeout: this._timeout,
      }, [runNumber]);
    } catch (error) {
      fromSqlToNativeError(error);
    }
    const result = { D: 0, I: 0, W: 0, E: 0, F: 0 };

    data.forEach((group) => {
      result[group['severity']] = group['COUNT(*)'];
    });
    return result;
  }

  /**
   * Method to fill criteria and return it as string
   * @param {Array} criteria Array of criteria set by the user
   * @returns {string} - criteria as string in SQL format
   */
  _getCriteriaAsString(criteria) {
    return criteria && criteria.length ? `WHERE ${criteria.join(' AND ')}` : '';
  }

  /**
   * Get the SQL Query used as a string
   * @param {string} criteriaVerbose - criteria as string in SQL format
   * @param {number} limit - limit of number of messages
   * @returns {string} - SQL Query as string
   */
  _getSQLQueryAsString(criteriaVerbose, limit) {
    return `SELECT * FROM \`messages\` ${criteriaVerbose} ORDER BY \`TIMESTAMP\` LIMIT ${limit}`;
  }

  /**
   * Translates `filters` from client side to SQL condition to put on WHERE clause
   *
   * filters = {
   * timestamp: {
   * $since: '2016-02-21T05:00:00.000Z'
   * },
   * level: {
   * $max: 6
   * },
   * severity: {
   * $in: ['W', 'E']
   * },
   * hostname: {
   * $match: 'host'
   * },
   * username: {
   * $exclude: ['name']
   * }
   * }
   *
   * values = ['Sun Jan 01 1989 00:00:00 GMT+0100 (CET)', 6, 'W', 'E', ...]
   * criteria = ['timestamp >= ?', 'level <= ?', 'severity in (?,?)', ...]
   * @param {object} filters - {...}
   * @returns {object} {values, criteria}
   */
  _filtersToSqlConditions(filters) {
    const values = [];
    const criteria = [];
    for (const field in filters) {
      if (!filters[field]) {
        continue;
      }
      const separator = field === 'message' ? '\n' : ' ';
      for (const operator in filters[field]) {
        if (filters[field][operator] === null || filters[field][operator] === false || !operator.includes('$')) {
          continue;
        }

        if (operator === '$matchEmpty' || operator === '$excludeEmpty') {
          // no parameterized value needed for $matchEmpty or $excludeEmpty, the SQL is static
        } else if (operator === '$since' || operator === '$until') {
          // read date, both input and output are GMT, no timezone to consider here
          values.push(new Date(filters[field][operator]).getTime() / 1000);
        } else {
          if ((operator === '$match' || operator === '$exclude') && filters[field][operator].split(separator).length > 1
          ) {
            const subValues = filters[field][operator].split(separator);
            values.push(...subValues);
          } else {
            values.push(filters[field][operator]);
          }
        }

        switch (operator) {
          case '$min':
          case '$since':
            criteria.push(`\`${field}\`>=?`);
            break;
          case '$max':
          case '$until':
            criteria.push(`\`${field}\`<=?`);
            break;
          case '$match': {
            const criteriaArray = filters[field].match.split(separator);

            // Either create a LIKE match or an exact match
            const toMatchCondition = (crit) =>
              crit.includes('%')
                ? `\`${field}\` LIKE (?)`
                : `\`${field}\` = ?`;

            const matchStr = criteriaArray.map(toMatchCondition).join(' OR ');

            const matchEmpty = filters[field].$matchEmpty;
            if (matchEmpty) {
              criteria.push(`(${matchStr} OR \`${field}\` = '' OR \`${field}\` IS NULL)`);
            } else if (criteriaArray.length > 1) {
              // Wrap so the OR doesn't bind looser than the AND between criteria in the WHERE clause
              criteria.push(`(${matchStr})`);
            } else {
              criteria.push(matchStr);
            }
            break;
          }
          case '$exclude': {
            const criteriaArray = filters[field].exclude.split(separator);

            const toExcludeCondition = (crit) =>
              crit.includes('%')
                ? `\`${field}\` LIKE (?) AND \`${field}\` IS NOT NULL`
                : `\`${field}\` = ? AND \`${field}\` IS NOT NULL`;

            criteria.push(`NOT(${criteriaArray.map(toExcludeCondition).join(' OR ')})`);

            const excludeEmpty = filters[field].$excludeEmpty;
            if (excludeEmpty) {
              criteria.push(`(\`${field}\` != '' AND \`${field}\` IS NOT NULL)`);
            }
            break;
          }
          case '$matchEmpty':
            // If no match value but $matchEmpty is true, we want to match only empty values
            if (!filters[field].$match) {
              criteria.push(`(\`${field}\` = '' OR \`${field}\` IS NULL)`);
            }
            break;
          case '$excludeEmpty':
            if (!filters[field].$exclude) {
              criteria.push(`(\`${field}\` != '' AND \`${field}\` IS NOT NULL)`);
            }
            break;
          case '$in':
            criteria.push(`\`${field}\` IN (?)`);
            break;
          default:
            this._logger.warn(`unknown operator ${operator}`);
            break;
        }
      }
    }
    return { values, criteria };
  }

  /**
   * Getter for the availability of the service
   * @returns {boolean} - true if service is available, false otherwise
   */
  get isAvailable() {
    return this._isAvailable;
  }
};

module.exports.QueryService = QueryService;
