const {log, MySQL} = require('@aliceo2/web-ui');

module.exports = class SQLDataSource {
  /**
   * Instanciate SQL data source and connect to database
   * MySQL options: https://github.com/mysqljs/mysql#connection-options
   * Limit option
   * @param {Object} configMySql - mysql config
   */
  constructor(configMySql) {
    if (!configMySql) {
      throw new Error('MySQL config is required to query logs');
    }

    this.connection = new MySQL(configMySql);

    this.connection
      .query('select count(*) as total from messages;')
      .then((rows) => {
        log.info(`Connected to mysql (${rows[0].total} logs inside ${configMySql.database})`);
      })
      .catch((error) => {
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
   *     $match: ['W', 'E']
   *   },
   *   username: {
   *     $exclude: ['coucou']
   *   }
   * }
   *
   * values = ['Sun Jan 01 1989 00:00:00 GMT+0100 (CET)', 6, 'W', 'E', ...]
   * criterias = ['timestamp >= ?', 'level <= ?', 'severity in (?,?)', ...]
   *
   * @param {Object} filters - {...}
   * @return {Object} {values, criterias}
   */
  filtersToSqlConditions(filters) {
    const values = [];
    const criterias = [];

    for (let field in filters) {
      if (!filters.hasOwnProperty(field)) {
        continue;
      }

      for (let operator in filters[field]) {
        if (filters[field][operator] === null || !operator.includes('$')) {
          continue;
        }

        if (operator === '$since' || operator === '$until') {
          // read date, both input and ouput are GMT, no timezone to consider here
          values.push((new Date(filters[field][operator])).getTime() / 1000);
        } else {
          values.push(filters[field][operator]);
        }

        switch (operator) {
          case '$min':
          case '$since':
            criterias.push(`\`${field}\`>=?`);
            break;
          case '$max':
          case '$until':
            criterias.push(`\`${field}\`<=?`);
            break;
          case '$match':
            criterias.push(this.matchToSql(field, filters[field][operator]));
            break;
          case '$exclude':
            criterias.push(this.excludeToSql(field, filters[field][operator]));
            break;
          default:
            log.warn(`unkown operator ${operator}`);
            break;
        }
      }
    }

    return {values, criterias};
  }

  /**
   * Convert $match to sql condition
   * @param {string} field
   * @param {Array.<string>} values
   * @return {string} blabla
   */
  matchToSql(field, values) {
    const placeholders = values.map(() => '?').join(',');
    const sql = `\`${field}\` IN (?)`;
    return sql;
  }

  /**
   * Convert $exclude to sql condition
   * @param {string} field
   * @param {Array.<string>} values
   * @return {string} blabla
   */
  excludeToSql(field, values) {
    // If field is null, don't exclude the value
    const placeholders = values.map(() => '?').join(',');
    const sql = `(NOT(\`${field}\` IN (${placeholders})) OR \`${field}\` IS NULL)`;
    return sql;
  }

  /**
   * Ask DB for a part of rows and the total count
   * - total: how many rows available (limited to 100k)
   * - more: true if has more than 100k rows
   * - limit: options.limit or 1k
   * - rows: the first `limit` rows
   * - count: how many rows inside `rows`
   * - time: how much did it take, in ms
   * @param {object} filters - criterias like MongoDB
   * @param {object} options - limit, etc.
   * @return {Promise.<Object>}
   */
  async queryFromFilters(filters, options) {
    if (!filters) {
      throw new Error('filters parameter is mandatory');
    }
    options = Object.assign({}, {limit: 100}, options);

    let criteriasString = '';
    const startTime = Date.now(); // ms

    const {criterias, values} = this.filtersToSqlConditions(filters);

    if (criterias.length) {
      criteriasString = `WHERE ${criterias.join(' AND ')}`;
    }

    // The rows asked with a limit
    const requestRows = `SELECT * FROM \`messages\` ${criteriasString}
      ORDER BY \`TIMESTAMP\` LIMIT ${options.limit}`;
    log.info(`requestRows: ${requestRows} ${JSON.stringify(values)}`);
    const rows = await this.connection.query(requestRows, values);

    // Count how many rows could be found, limit to 100k anyway
    const requestCount = `SELECT COUNT(*) as total FROM
      (SELECT 1 FROM \`messages\` ${criteriasString} LIMIT 100001) t1`;
    log.info(`requestCount: ${requestCount} ${JSON.stringify(values)}`);
    const resultCount = await this.connection.query(requestCount, values);
    let total = parseInt(resultCount[0].total, 10);
    let more = false;

    // "more" flag indicates more rows available
    if (total > 100000) {
      total = 100000;
      more = true;
    }

    const endTime = Date.now(); // ms
    const totalTime = endTime - startTime; // ms

    log.info(`Query done in ${totalTime}ms`);

    return {
      rows,
      total: total,
      count: rows.length,
      more,
      limit: options.limit,
      time: totalTime // ms
    };
  }
};

