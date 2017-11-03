const MySQL = require('./../db/mysql.js');
const log = require('./../log.js');

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
   * @param {object} config - configuration object for db, see docs for more details
   */
  constructor(config) {
    try {
      this.connection = new MySQL(config);
      log.debug('Connected to the database');
    } catch (err) {
      log.error(err.message);
    }
  }

  /**
   * Destroyes connection
   */
  close() {
    this.connection.close();
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

    return this.connection.query(sql, [endpoint, authKey, p256dhKey]);
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
    return this.connection.query(sql, [endpoint]);
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
    return this.connection.query(sql, [preferences, endpoint]);
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
    return this.connection.query(sql, [endpoint]);
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
    return this.connection.query(sql, [deviceToken]);
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
    return this.connection.query(sql, [deviceToken]);
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
    return this.connection.query(sql, [preferences, deviceToken]);
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
    return this.connection.query(sql, [deviceToken]);
  }
}
module.exports = Database;
