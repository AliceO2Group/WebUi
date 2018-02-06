const mysql = require('mysql');
const assert = require('assert');
const log = require('./../log/log.js');

/**
 * MySQL pool wrapper
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 * @author Vladimir Kosmala <vladimir.kosmala@cern.ch>
 */
class MySQL {
  /**
   * Creates pool of connections
   * @param {object} config configuration object including hostname, username, password
   * and database name.
   */
  constructor(config) {
    assert(config.host, 'Missing config value: mysql.host');
    assert(config.user, 'Missing config value: mysql.user');
    assert(config.database, 'Missing config value: mysql.database');
    config.port = (!config.port) ? 3306 : config.port;
    config.password = (!config.password) ? '' : config.password;

    this.config = config;
    this.pool = mysql.createPool(config);
    this.pool.getConnection((error, connection) => {
      if (error) {
        throw new Error(this.errorHandler(error));
      }
      connection.release();
    });
  }

  /**
   * Prepares and executes query.
   * Sets up 60s timeout.
   * @param {string} query - SQL query
   * @param {array} parameters - parameters to be boud to the query
   * @return {object} promise
   */
  query(query, parameters) {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: query,
        timeout: 60000,
        values: parameters
      }, (error, results) => {
        if (error) {
          reject(new Error(this.errorHandler(error)));
        }
        resolve(results);
      });
    });
  }

  /**
   * Smothly terminates connection pool
   */
  close() {
    this.pool.end(() => {
    });
  }

  /**
   * The purpose is to translate Error object from mysql to more human one
   * so we can send it to final user when it can be recovered
   * @param {Error} err - the error from a catch or callback
   * @return {string} the new state of this source instance
   */
  errorHandler(err) {
    let message;

    // Handle some common errors and just report the user he can't use mysql
    if (err.code === 'ER_NO_DB_ERROR') {
      message = `Unable to connect to mysql, ${this.config.database} database not found`;
      log.warn(message);
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      message = `Unable to connect to mysql, "messages" table not found in ${this.config.database}`;
      log.warn(message);
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      message = `Unable to connect to mysql on ${this.config.host}:${this.config.port}`;
      log.warn(message);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      message = `Unable to connect to mysql, access denied for ${this.config.user}`;
      log.warn(message);
    } else {
      message = `Unable to connect to mysql: ${err.code}`;
      log.error(err); // log the whole error because we don't know why connection crashed
    }

    return message;
  }
}

module.exports = MySQL;
