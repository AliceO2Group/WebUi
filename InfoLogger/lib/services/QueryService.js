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
const { LogManager } = require('@aliceo2/web-ui');
const { fromSqlToNativeError } = require('../utils/fromSqlToNativeError');

class QueryService {
  /**
   * Query service that is to be used to map the InfoLogger parameters to SQL query and retrieve data
   * @param {object} configMySql - mysql config
   */
  constructor(configMySql = {}) {
    configMySql.user = configMySql?.user ?? 'gui';
    configMySql.password = configMySql?.password ?? '';
    configMySql.host = configMySql?.host ?? 'localhost';
    configMySql.port = configMySql?.port ?? 3306;
    configMySql.database = configMySql?.database ?? 'info_logger';
    configMySql.connectionLimit = configMySql?.connectionLimit ?? 25;
    this._timeout = configMySql?.timeout ?? 10000;
    this._host = configMySql.host;
    this._port = configMySql.port;

    this._pool = mariadb.createPool(configMySql);
    this._isAvailable = false;
    this._logger = LogManager.getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/query-service`);
  }

  /**
   * Method to test connection of mysql connector once initialized
   * @param {number} timeout - timeout for the connection test
   * @param {boolean} shouldThrow - whether an error should be thrown on failure
   * @returns {Promise} - a promise that resolves if connection is successful
   */
  async checkConnection(timeout = this._timeout, shouldThrow = true) {
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

    let rows = [];
    try {
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
      + `in ('D', 'I', 'W', 'E', 'F') GROUP BY severity;`;
    let data = [];
    try {
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
      for (const operator in filters[field]) {
        if (filters[field][operator] === null || !operator.includes('$')) {
          continue;
        }

        if (operator === '$since' || operator === '$until') {
          // read date, both input and output are GMT, no timezone to consider here
          values.push(new Date(filters[field][operator]).getTime() / 1000);
        } else {
          const separator = field === 'message' ? '\n' : ' ';
          if ((operator === '$match' || operator === '$exclude') && filters[field][operator].split(separator).length > 1
          ) {
            const subValues = filters[field][operator].split(separator);
            subValues.forEach((value) => values.push(value));
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
            const separator = field === 'message' ? '\n' : ' ';
            const criteriaArray = filters[field].match.split(separator);
            if (criteriaArray.length <= 1) {
              if (criteriaArray.toString().includes('%')) {
                criteria.push(`\`${field}\` LIKE (?)`);
              } else {
                criteria.push(`\`${field}\` = ?`);
              }
            } else {
              let criteriaString = '(';
              criteriaArray.forEach((crit) => {
                if (crit.includes('%')) {
                  criteriaString += `\`${field}\` LIKE (?) OR `;
                } else {
                  criteriaString += `\`${field}\` = ? OR `;
                }
              });
              criteriaString = criteriaString.substr(0, criteriaString.length - 4);
              criteriaString += ')';
              criteria.push(criteriaString);
            }
            break;
          }
          case '$exclude': {
            const separator = field === 'message' ? '\n' : ' ';
            const criteriaArray = filters[field].exclude.split(separator);
            if (criteriaArray.length <= 1) {
              if (criteriaArray.toString().includes('%')) {
                criteria.push(`NOT(\`${field}\` LIKE (?) AND \`${field}\` IS NOT NULL)`);
              } else {
                criteria.push(`NOT(\`${field}\` = ? AND \`${field}\` IS NOT NULL)`);
              }
            } else {
              let criteriaString = 'NOT(';
              criteriaArray.forEach((crit) => {
                if (crit.includes('%')) {
                  criteriaString += `\`${field}\` LIKE (?) AND \`${field}\` IS NOT NULL OR `;
                } else {
                  criteriaString += `\`${field}\` = ? AND \`${field}\` IS NOT NULL OR `;
                }
              });
              criteriaString = criteriaString.substr(0, criteriaString.length - 4);
              criteriaString += ')';
              criteria.push(criteriaString);
            }

            break;
          }
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
