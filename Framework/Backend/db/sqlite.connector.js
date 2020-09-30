const log = new (require('../log/Log.js'))('SQLiteConnector');
const sqlite3 = require('sqlite3').verbose();

/**
 * SQLite database connector
 * @example
 * const sqlite = new SQLiteConnector(<path>);
 * sqlite.init();
 * sqlite.query('SELECT * FROM mytable, []);
 * sqlite.query('INSERT INTO mytable (name) VALUES (?), ['user'], false);
 */
class SQLiteConnector {
  /**
   * Initialize connector
   * @param {string} pathname - path to SQLite DB file
   */
  constructor(pathname) {
    if (!pathname) {
      throw new Error('No pathname provided');
    }
    this.pathname = pathname;
    this.db;
  }

  /**
   * Initialize the database connection
   * @return {Promise}
   */
  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.pathname, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          log.error(err.message);
          reject(new Error(`Cannot initiate the database with provided path: ${this.pathname}`));
        } else {
          log.info(`Successfully connected to the database on path: ${this.pathname}`);
          resolve();
        }
      });
    });
  }

  /**
   * Runs the passed query on the database,
   * @param {string} query - SQLite query
   * @param {array} values - values to be bound to the query
   * @param {boolean} read - if true use #all otherwise #run
   * @return {Promise.<Array<JSON>, Error>}
   */
  async query(query, values = [], read = true) {
    return new Promise((resolve, reject) => {
      if (read) {
        this.readQuery(query, values)
          .then((profile) => resolve(profile))
          .catch((err) => reject(err));
      } else {
        this.generalQuery(query, values)
          .then(() => resolve([]))
          .catch((err) => reject(err));
      }
    });
  }

  /**
   * Query that reads data from the database
   * It will return all rows matching the query
   * @param {string} query - SQLite query
   * @param {array} values - values to be bound to the query
   * @return {Promise.<Array<JSON>, Error>}
   */
  async readQuery(query, values) {
    return new Promise((resolve, reject) => {
      this.db.all(query, values, (err, row) => {
        if (err) {
          log.error(err.message);
          reject(err);
        }
        if (row) {
          log.info(`Query ${query} was successful`);
        } else {
          log.warn('No result for this query');
        }
        resolve(row);
      });
    });
  }

  /**
   * Query that writes and deletes data from the database;
   * It does not return any data from the query
   * @param {string} query - SQLite query
   * @param {array} values - values to be bound to the query
   * @return {Promise.<_, Error>}
   */
  async generalQuery(query, values) {
    return new Promise((resolve, reject) => {
      this.db.run(query, values, (err) => {
        if (err) {
          log.error(err.message);
          reject(err);
        }
        log.info(`Query ${query} was successful`);
        resolve();
      });
    });
  }

  /**
   * Close database connection
   * @return {Promise.<_, Error>}
   */
  async close() {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          log.error(err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}

module.exports = SQLiteConnector;
