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

const log = new (require('@aliceo2/web-ui').Log)('InfoLoggerSQLSource');

module.exports = class SQLDataSource {
  /**
   * Instantiate SQL data source and connect to database
   * MySQL options: https://github.com/mysqljs/mysql#connection-options
   * Limit option
   * @param {Object} connection - mysql connection
   * @param {Object} configMySql - mysql config
   */
  constructor(connection, configMySql) {
    this.configMySql = configMySql;
    this.connection = connection;
  }

  /**
   * Method to check if mysql driver connection is up
   * @return {Promise} with the results
   */
  async isConnectionUpAndRunning() {
    return await this.connection
      .query('select timestamp from messages LIMIT 1000;')
      .then(() => {
        const url = `${this.configMySql.host}:${this.configMySql.port}/${this.configMySql.database}`;
        log.info(`Connected to infoLogger database ${url}`);
      })
      .catch((error) => {
        log.error(error);
        throw error;
      });
  }


  /**
   * Translates `filters` from client side to SQL condition to put on WHERE clause
   *
   * filters = {
   *   timestamp: {
   *     $since: '2016-02-21T05:00:00.000Z'
   *   },
   *   level: {
   *     $max: 6
   *   },
   *   severity: {
   *     $in: ['W', 'E']
   *   },
   *    hostname: {
   *     $match: 'host'
   *   },
   *   username: {
   *     $exclude: ['name']
   *   }
   * }
   *
   * values = ['Sun Jan 01 1989 00:00:00 GMT+0100 (CET)', 6, 'W', 'E', ...]
   * criteria = ['timestamp >= ?', 'level <= ?', 'severity in (?,?)', ...]
   *
   * @param {Object} filters - {...}
   * @return {Object} {values, criteria}
   */
  _filtersToSqlConditions(filters) {
    const values = [];
    const criteria = [];
    const criteriaVerbose = [];
    for (const field in filters) {
      if (!filters.hasOwnProperty(field)) {
        continue;
      }
      for (const operator in filters[field]) {
        if (filters[field][operator] === null || !operator.includes('$')) {
          continue;
        }

        if (operator === '$since' || operator === '$until') {
          // read date, both input and output are GMT, no timezone to consider here
          values.push((new Date(filters[field][operator])).getTime() / 1000);
        } else {
          values.push(filters[field][operator]);
        }

        switch (operator) {
          case '$min':
          case '$since':
            criteria.push(`\`${field}\`>=?`);
            criteriaVerbose.push(` \`${field}\`>='${filters[field].since}'`);
            break;
          case '$max':
          case '$until':
            criteria.push(`\`${field}\`<=?`);
            criteriaVerbose.push(` \`${field}\`<='${filters[field].until}'`);
            break;
          case '$match':
            criteria.push(`\`${field}\` LIKE (?)`);
            criteriaVerbose.push(` \`${field}\` LIKE '${filters[field].match}'`);
            break;
          case '$exclude':
            criteria.push(`(NOT(\`${field}\` LIKE (?)) OR \`${field}\` IS NULL)`);
            criteriaVerbose.push(` (NOT(\`${field}\` LIKE '${filters[field].exclude}' `
              + `OR \`${field.exclude}\` IS NULL)`);
            break;
          case '$in':
            criteria.push(`\`${field}\` IN (?)`);
            criteriaVerbose.push(` \`${field}\` IN [${filters[field][operator]}]`);
            break;
          default:
            log.warn(`unknown operator ${operator}`);
            break;
        }
      }
    }
    return {values, criteria, criteriaVerbose};
  }

  /**
   * Ask DB for a part of rows and the total count
   * - total: how many rows available (limited to 100k)
   * - more: true if has more than 100k rows
   * - limit: options.limit or 1k
   * - rows: the first `limit` rows
   * - count: how many rows inside `rows`
   * - time: how much did it take, in ms
   * @param {object} filters - criteria like MongoDB
   * @param {object} options - limit, etc.
   * @return {Promise.<Object>}
   */
  async queryFromFilters(filters, options) {
    if (!filters) {
      throw new Error('filters parameter is mandatory');
    }
    options = Object.assign({}, {limit: 100}, options);

    const startTime = Date.now(); // ms
    const {criteria, values, criteriaVerbose} = this._filtersToSqlConditions(filters);
    const criteriaString = this._getCriteriaAsString(criteria);

    const rows = await this._queryMessagesOnOptions(criteriaString, options, values)
      .catch((error) => {
        log.error(error);
        throw error;
      });

    const resultCount = await this._countMessagesOnOptions(criteriaString, values);

    let total = parseInt(resultCount[0].total);
    let more = false;

    // "more" flag indicates more rows available
    if (total > 100000) {
      total = 100000;
      more = true;
    }

    const totalTime = Date.now() - startTime; // ms
    log.debug(`Query done in ${totalTime}ms`);
    return {
      rows,
      total: total,
      count: rows.length,
      more,
      limit: options.limit,
      time: totalTime, // ms
      queryAsString: this._getSQLQueryAsString(criteriaVerbose, options.limit)
    };
  }

  /**
   * Method to fill criteria and return it as string
   * @param {Array} criteria Array of criteria set by the user
   * @return {string}
   */
  _getCriteriaAsString(criteria) {
    return (criteria && criteria.length) ? `WHERE ${criteria.join(' AND ')}` : '';
  }

  /**
   * Get the SQL Query used as a string
   * @param {string} criteriaVerbose
   * @param {JSON} limit
   * @return {string}
   */
  _getSQLQueryAsString(criteriaVerbose, limit) {
    return `SELECT * FROM \`messages\` WHERE ${criteriaVerbose} ORDER BY \`TIMESTAMP\` DESC LIMIT ${limit}`;
  }

  /**
   * Method to retrieve the messages based on passed Options
   * @param {string} criteriaString as a string
   * @param {Object} options containing limit on messages
   * @param {Array} values of filter parameters
   * @return {Promise} rows
   */
  _queryMessagesOnOptions(criteriaString, options, values) {
    /* eslint-disable max-len */
    // The rows asked with a limit
    const requestRows = `SELECT * from (SELECT * FROM \`messages\` ${criteriaString} ORDER BY \`TIMESTAMP\` DESC LIMIT ${options.limit}) as reordered ORDER BY \`TIMESTAMP\` ASC`;
    /* eslint-enable max-len */
    log.debug(`requestRows: ${requestRows} ${JSON.stringify(values)}`);
    return this.connection.query(requestRows, values)
      .then((data) => data);
  }

  /**
   * Count how many rows could be found, limit to 100k anyway
   * @param {string} criteriaString as a string
   * @param {Array} values of filter parameters
   * @return {Promise}
   */
  _countMessagesOnOptions(criteriaString, values) {
    const requestCount = `SELECT COUNT(*) as total FROM (SELECT 1 FROM \`messages\` ${criteriaString} LIMIT 100001) t1`;
    log.debug(`requestCount: ${requestCount} ${JSON.stringify(values)}`);
    return this.connection.query(requestCount, values)
      .then((data) => data)
      .catch((error) => {
        log.error(error);
        return [{total: -1}];
      });
  }
};

