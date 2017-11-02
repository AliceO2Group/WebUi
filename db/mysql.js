const mysql = require('mysql');
const log = require('./../log.js');
/**
 * MySQL pool wrapper
 * @author Adam Wegrzynek <adam.wegrzynek@cern.ch>
 * @author Vladimir Kosmala <vladimir.kosmala@cern.ch>
 */

class MySQL {

  constructor(config) {
    this.pool = mysql.createPool(config);
    this.pool.getConnection((error, connection) => {
      if (error) {
        throw new Error(this.errorHandler(err));
      }
      connection.release();
    });
  }
  
  query(query, parameters) {
    return new Promise((resolve, reject) => {
      this.pool.query({
        sql: query,
        timeout: 60000,
        values: parameters
      }, (error, results, fields) => {
        if (error) { 
          reject(new Error(this.errorHandler(err)));
        }
        resolve(result);
      }
    }
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
      message = `Unable to connect to mysql, ${this.options.database} database not found`;
      log.warn(message);
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      message = `Unable to connect to mysql, "messages" table not found in ${this.options.database}`;
      log.warn(message);
    } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
      message = `Unable to connect to mysql on ${this.options.host}:${this.options.port}`;
      log.warn(message);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      message = `Unable to connect to mysql, access denied for ${this.options.user}`;
      log.warn(message);
    } else {
      message = `Unable to connect to mysql: ${err.code}`;
      log.error(err); // log the whole error because we don't know why connection crashed
    }

    return message;
  }
}

module.exports = MySQL;
