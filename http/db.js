const mysql = require('mysql');
const config = require('./../config.json');
const log = require('./../log.js');

const connection = mysql.createConnection({
  host: config.pushNotifications.host,
  user: config.pushNotifications.user,
  password: config.pushNotifications.password,
  database: config.pushNotifications.database
});

/**
 * Database Module containing functions for-
 * Insertion and Deletion of Subscriptions for both, APN and other browsers
 * Updating User Notification Preferences
 * Fetching User Notification Preferences
 * @author Anirudh Goel <anirudh.goel@cern.ch>
 */
class Database {
  /**
   * Establishes connections with MySQL Database
   */
  constructor() {
    connection.connect(function(err) {
      if (err) {
        throw err;
      }
      log.debug('Connected to the database');
    });
  }

  /**
   * Saves 'web-push' subscription object to Database
   * @param {object} sub - Subscription Object
   * @return {Promise} Promise
   */
  insertSubscription(sub) {
    let endpoint = sub.endpoint;
    let authKey = sub.keys.auth;
    let p256dhKey = sub.keys.p256dh;

    if ((endpoint == undefined || '') || (authKey == undefined || '')
      || (p256dhKey == undefined || '')) {
      throw Error('Invalid subscription object.');
    }

    let sql = 'INSERT INTO subscriptions (endpoint, auth_key, p256dh_key) VALUES (?, ?, ?)';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [endpoint, authKey, p256dhKey], function(err, result) {
        if (err) {
          throw reject(err);
        }
        log.debug('Subscription saved successfully in database.');
        resolve(true);
      });
    });
  }

  /**
   * Module for deleting subscriotion from MySQL database
   * @param {string} endpoint - Subscription Endpoint
   * @return {Promise} Promise
   */
  deleteSubscription(endpoint) {
    let sql = 'DELETE FROM subscriptions WHERE endpoint = ?';

    if (endpoint == undefined || '') {
      throw Error('Invalid endpoint.');
    }

    return new Promise(function(resolve, reject) {
      connection.query(sql, [endpoint], function(err, result) {
        if (err) {
          throw reject(err);
        }
        log.debug('Deleted successfully from database. endpoint: ', endpoint);
        resolve(true);
      });
    });
  }

  /**
   * Module for updating user notification preferences in MySQL database
   * @param {object} data - Preferences Object
   * @return {Promise} Promise
   */
  updatePreferences(data) {
    let endpoint = data.endpoint;
    let preferences = data.preferences;

    if ((endpoint == undefined || '') || (preferences == undefined || '')) {
      throw Error('Invalid endpoint or preferences.');
    }

    let sql = 'UPDATE subscriptions SET preferences = ? WHERE endpoint = ?';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [preferences, endpoint], function(err, result) {
        if (err) {
          throw reject(err);
        }
        if (result.affectedRows == 0) {
          reject('No subscription exists with endpoint: ' + endpoint);
        }
        log.debug('Preferences Updated successfully.');
        resolve(true);
      });
    });
  }

  /**
   * Module for fetching user notification preferences from MySQL database
   * @param {object} data - Object containing Endpoint
   * @return {Promise} Promise
   */
  getPreferences(data) {
    let endpoint = data.endpoint;

    if (endpoint == undefined || '') {
      throw Error('Invalid endpoint.');
    }

    let sql = 'SELECT preferences FROM subscriptions WHERE endpoint = ?';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [endpoint], function(err, result) {
        if (err) {
          throw reject(err);
        }
        resolve(result);
      });
    });
  }

  /**
   * Save Safari subscription to MySQL database
   * @param {string} deviceToken - Unique Device Identifier Token
   * @return {Promise} Promise
   */
  insertSubscriptionSafari(deviceToken) {
    if (deviceToken == undefined || '') {
      throw Error('Invalid Device Token.');
    }

    let sql = 'INSERT INTO subscriptions (deviceToken) VALUES (?)';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [deviceToken], function(err, result) {
        if (err) {
          throw reject(err);
        }
        log.debug('Safari Subscription saved successfully in database.');
        resolve(true);
      });
    });
  }

  /**
   * Delete Safari subscriotion from MySQL database
   * @param {string} deviceToken - Unique Device Identifier Token
   * @return {Promise} Promise
   */
  deleteSubscriptionSafari(deviceToken) {
    if (deviceToken == undefined || '') {
      throw Error('Invalid Device Token.');
    }

    let sql = 'DELETE FROM subscriptions WHERE deviceToken = ?';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [deviceToken], function(err, result) {
        if (err) {
          throw reject(err);
        }
        log.debug('Deleted Safari subscriptions successfully from database. ');
        resolve(true);
      });
    });
  }

  /**
   * Module for updating user notification preferences in MySQL database for APNs
   * @param {object} data - Object containing Device Token and preferences
   * @return {Promise} Promise
   */
  updatePreferencesSafari(data) {
    let deviceToken = data.deviceToken;
    let preferences = data.preferences;

    if ((deviceToken == undefined || '') || (preferences == undefined || '')) {
      throw Error('Invalid deviceToken or preferences.');
    }

    let sql = 'UPDATE subscriptions SET preferences = ? WHERE deviceToken = ?';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [preferences, deviceToken], function(err, result) {
        if (err) {
          throw reject(err);
        }
        if (result.affectedRows == 0) {
          reject('No subscription exists with deviceToken: ' + deviceToken);
        }
        log.debug('Preferences Updated successfully.');
        resolve(true);
      });
    });
  }

  /**
   * Module for fetching user notification preferences from MySQL database for APNs
   * @param {object} data - Object containing Device Token
   * @return {Promise} Promise
   */
  getPreferencesSafari(data) {
    let deviceToken = data.deviceToken;

    if (deviceToken == undefined || '') {
      throw Error('Invalid deviceToken.');
    }

    let sql = 'SELECT preferences FROM subscriptions WHERE deviceToken = ?';

    return new Promise(function(resolve, reject) {
      connection.query(sql, [deviceToken], function(err, result) {
        if (err) {
          throw reject(err);
        }
        resolve(result);
      });
    });
  }
}
module.exports = Database;
