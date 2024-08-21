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

const logger = require('@aliceo2/web-ui').LogManager
  .getLogger(`${process.env.npm_config_log_label ?? 'ilg'}/sql`);

module.exports = class SQLDataSource {
  /**
   * Instantiate SQL data source and connect to database
   * MySQL options: https://github.com/mysqljs/mysql#connection-options
   * Limit option
   * @param {object} connection - mysql connection
   * @param {object} configMySql - mysql config
   */
  constructor(connection, configMySql) {
    this.configMySql = configMySql;
    this.connection = connection;
  }

  /**
   * Method to check if mysql driver connection is up
   * @returns {Promise} with the results
   */
  async isConnectionUpAndRunning() {
    return await this.connection
      .query('select timestamp from messages LIMIT 1000;')
      .then(() => {
        const url = `${this.configMySql.host}:${this.configMySql.port}/${this.configMySql.database}`;
        logger.info(`Connected to infoLogger database ${url}`);
      })
      .catch((error) => {
        logger.error(error);
        throw error;
      });
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
            logger.warn(`unknown operator ${operator}`);
            break;
        }
      }
    }
    return { values, criteria };
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
   * @param {object} options - limit, etc.
   * @returns {Promise.<object>} - {total, more, limit, rows, count, time}
   */
  async queryFromFilters(filters, options) {
    if (!filters) {
      throw new Error('filters parameter is mandatory');
    }
    options = { limit: 100000, ...options };

    const startTime = Date.now(); // ms
    const { criteria, values } = this._filtersToSqlConditions(filters);
    const criteriaString = this._getCriteriaAsString(criteria);

    const rows = await this._queryMessagesOnOptions(criteriaString, options, values)
      .catch((error) => {
        logger.error(error);
        throw error;
      });

    const totalTime = Date.now() - startTime; // ms
    logger.debug(`Query done in ${totalTime}ms`);
    return {
      rows,
      count: rows.length,
      limit: options.limit,
      time: totalTime, // ms
      queryAsString: this._getSQLQueryAsString(criteriaString, options.limit),
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
    return this.connection.query(groupByStatement, [runNumber]).then((data) => {
      const result = {
        D: 0,
        I: 0,
        W: 0,
        E: 0,
        F: 0,
      };

      /**
       * data is of structure:
       * [
       *  RowDataPacket { severity: 'E', 'COUNT(*)': 102 }
       * ]
       */
      data.forEach((group) => {
        result[group['severity']] = group['COUNT(*)'];
      });
      return result;
    });
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
   * Method to retrieve the messages based on passed Options
   * @param {string} criteriaString as a string
   * @param {object} options containing limit on messages
   * @param {Array} values of filter parameters
   * @returns {Promise} rows
   */
  _queryMessagesOnOptions(criteriaString, options, values) {
    // The rows asked with a limit
    const requestRows = `SELECT * FROM \`messages\` ${criteriaString} ORDER BY \`TIMESTAMP\` LIMIT ${options.limit}`;

    return this.connection.query(requestRows, values)
      .then((data) => data);
  }
};
