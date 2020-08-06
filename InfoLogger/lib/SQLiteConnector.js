const log = new (require('@aliceo2/web-ui').Log)('SQLiteConnector');
const sqlite3 = require('sqlite3').verbose();

/**
 * SQLite database wrapper
 */
class SQLiteConnector {
  /**
     * Initialize connector and test the connection
     * @param {string} pathname - path to SQLite DB file
     */
  constructor(pathname) {
    this.db;
    this.init(pathname);

    this.connectionQuery = 'SELECT * FROM profiles LIMIT 1';
    this.testConnection(this.connectionQuery);
  }

  /**
     * Initialize the database connection
     * @param {string} pathname - path to SQLite DB file
     * @return {Promise}
     */
  async init(pathname) {
    this.db = new sqlite3.Database(pathname, sqlite3.OPEN_READWRITE, (err) => {
      if (err) {
        log.error(err.message);
      }
      log.info('Successfully connected to the database.');
    });
  }

  /**
     * Method to test connection of sqlite connector once initialized
     * @param {string} query - query to be executed to test the connection
     * @return {Promise}
     */
  async testConnection(query) {
    return new Promise((resolve, reject) => {
      this.db.get(query, [], function(err, row) {
        if (err) {
          log.error(err.message);
          reject(err);
        }
        if (row) {
          log.info(`Test query ${query} was successful with result ${row.profile_name}`);
        }
        resolve();
      });
    });
  }

  /**
     * Runs the passed query on the database,
     * @param {string} query - SQLite query
     * @param {array} values - values to be bound to the query
     * @param {boolean} read - if true use #get otherwise #run
     */
  async query(query, values, read=false) {
    return new Promise((resolve, reject) => {
      if (read) {
        this.read_query(query, values).then((profile) => resolve(profile))
          .catch((err) => reject(err));
      } else {
        this.general_query(query, values).then(() => resolve())
          .catch((err) => reject(err));
      }
    });
  }

  /**
     * Query that reads data from the database
     * @param {string} query - SQLite query
     * @param {array} values - values to be bound to the query
     */
  async readQuery(query, values) {
    return new Promise((resolve, reject) => {
      this.db.get(query, values, (err, row) => {
        if (err) {
          log.err(err.message);
          reject(err);
        }
        if (row) {
          log.info('Successfully fetched the required data');
        } else {
          log.warn('No result for this query');
        }
        resolve(row);
      });
    });
  }

  /**
     * Query that writes and deletes data from the database
     * @param {string} query - SQLite query
     * @param {array} values - values to be bound to the query
     */
  async generalQuery(query, values) {
    return new Promise((resolve, reject) => {
      this.db.run(query, values, function(err) {
        if (err) {
          log.err(err.message);
          reject(err);
        }
        log.info(`Query ${query} was successful`);
        resolve();
      });
    });
  }

  /**
     * Close database
     */
  async closeDatabase() {
    this.db.close((err) => {
      if (err) {
        return log.err(err.message);
      }
    });
  }
}
module.exports = SQLiteConnector;
