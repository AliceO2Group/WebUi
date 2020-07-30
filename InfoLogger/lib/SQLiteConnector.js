const log = new (require('./../log/Log.js'))('SQLiteConnector');
var sqlite3 = require('sqlite3').verbose();

/**
 * SQLite database wrapper
 */
class SQLiteConnector {
  /**
   * Initialize the database
   */
  constructor(config) {
    this.db = new sqlite3.Database('', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          log.err(err.message);
        }
        log.info('Successfully connected to the database.');
      });
    
  }

//   /**
//   * Write the created profile into the database
//   * @param {string} profileId
//   * @param {Object} profile
//   */
//   async createNewProfile(profileId,profile) {
    
//     this.db.run(`INSERT INTO profiles(name) VALUES(?)`, profileId, function(err) {
//         if (err) {
//           log.err(err.message);
//         }
//         // get the last insert id
//         log.info(`A row has been inserted with rowid ${this.lastID}`);
//       });
    
//   }

  /**
   * Runs the passed query on the database
   * @param {string} query - SQL query
   * @param {array} values - values to be bound to the query
   */
  async query(query, values) {
    
    this.db.run(query, values, function(err) {
        if (err) {
          log.err(err.message);
        }
        log.info(`Query ${query} was successful`);
      });

  }

  /**
  * Fetch profile data from database based on the profile name
  * @param {string} profileId
  */
  async fetchProfile(profileId) {
    let sql = `SELECT *
                FROM profiles
                WHERE profileId  = ?`;
    var profile = undefined;
    this.db.get(sql, [profileId], (err, row) => {
        if (err) {
            log.err(err.message);
        }
        if (row) {
            log.info("Successfully fetched profile data");
            profile = row;
        } else {
            log.warn("No profile found with the given name");
        }
    });

    return profile;
  }

//   /**
//   * Remove profile form the database
//   * @param {string} profileId
//   */
//   async removeProfile(profileId) {
//     this.db.run(`DELETE FROM profiles WHERE profileId=?`, profileId, function(err) {
//         if (err) {
//           log.err(err.message);
//         }
//         log.info(`Row deleted ${this.changes}`);
//       });
    
//   }

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
