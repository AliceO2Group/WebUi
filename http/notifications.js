const webpush = require('web-push');
const Database = require('./db.js');
const log = require('./../log.js');
const path = require('path');

/**
 */
class Notifications {
  /** Sets up VAPID keys and specified REST API routes
   * @param {object} server - https server
   * @param {object} config configuration object (see documentation for the description of fields)
   */
  constructor(server, config) {
    const vapidKeys = {
      publicKey: config.vapid.publicKey,
      privateKey: config.vapid.privateKey
    };

    webpush.setVapidDetails(
      'mailto: ' + config.email,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    server.post('/save-subscription', this.saveSubscription);
    server.post('/update-preferences', this.updatePref);
    server.post('/update-preferences-safari', this.updatePrefSafari);
    server.post('/get-preferences', this.getPref);
    server.post('/get-preferences-safari', this.getPrefSafari);
    server.post('/delete-subscription', this.deleteSubscription);

    server.postNoAuth('/v1/pushPackages/web.ch.cern.anirudh',
      (req, res) => this.safariPermission(res)
    );
    server.postNoAuth('/v1/devices/:deviceToken/registrations/:websitePushID',
      (req, res) => this.safariSubscribe(req, res)
    );
    server.deleteNoAuth('/v1/devices/:deviceToken/registrations/:websitePushID',
      (req, res) => this.safariUnsubscribe(req, res)
    );
    server.postNoAuth('/v1/log', (req, res) => log.debug(req.body));

    server.passToTemplate('applicationServerPublicKey', config.vapid.publicKey);
    server.passToTemplate('pushId', config.APN.pushId);
    server.passToTemplate('hostname', config.APN.hostname);

    this.db = new Database(config);
  }
  /**
   * Receives User Subscription object from 'web-push' server
   * and saves it to Database
   * @param {object} req - request object
   * @param {object} res - response object
   */
  saveSubscription(req, res) {
    if (!req.body || !req.body.endpoint) {
      // Not a valid subscription.
      res.status(400);
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        error: {
          id: 'no-endpoint',
          message: 'Subscription must have an endpoint.'
        }
      }));
      return;
    }

    this.db.insertSubscription(req.body)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.status(500);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          error: {
            id: 'unable-to-save-subscription',
            message: 'The subscription was received but we were unable to save it to our database.'
          }
        }));
      });
  }

  /**
   * Receives User Notification Preferences and updates it in Database
   * @param {object} req - request object
   * @param {object} res - response object
   */
  updatePref(req, res) {
    this.db.updatePreferences(req.body)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.send(err);
      });
  }

  /**
   * Gets User Notification Preferences from Database
   * and passes it to browser
   * @param {object} req - request object
   * @param {object} res - response object
   */
  getPref(req, res) {
    this.db.getPreferences(req.body)
      .then(function(preferences) {
        res.setHeader('Content-Type', 'application/json');
        res.send(preferences);
      })
      .catch(function(err) {
        res.send(err);
      });
  }

  /**
   * Deletes user subscription from database
   * @param {object} req - request object
   * @param {object} res - response object
   */
  deleteSubscription(req, res) {
    this.db.deleteSubscription(req.body.endpoint)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.send(err);
      });
  }

  /**
   * When the user clicks on 'Allow' in notification prompt box,
   * a call is made to this function to receive a zipped push package.
   * @param {object} res - response object
   */
  safariPermission(res) {
    log.info(path.resolve('./pushpackage.zip'));
    res.sendFile(path.resolve('./pushpackage.zip'));
  }

  /**
   * Receives Device Token from APN server
   * and saves it to Database
   * @param {object} req - request object
   * @param {object} res - response object
   */
  safariSubscribe(req, res) {
    this.db.insertSubscriptionSafari(req.params.deviceToken)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.status(500);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
          error: {
            id: 'unable-to-save-subscription',
            message: 'The Safari subscription was received but' +
            'we\'re unable to save it to our database.'
          }
        }));
      });
  }

  /**
   * When user removes/denies the notifications from Safari Preferences,
   * a call to this function is made.
   * @param {object} req - request object
   * @param {object} res - response object
   */
  safariUnsubscribe(req, res) {
    this.db.deleteSubscriptionSafari(req.params.deviceToken)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.send(err);
      });
  }

  /**
   * Gets User Notification Preferences for APNs from Database
   * and passes it to browser
   * @param {object} req - request object
   * @param {object} res - response object
   */
  getPrefSafari(req, res) {
    this.db.getPreferencesSafari(req.body)
      .then(function(preferences) {
        res.setHeader('Content-Type', 'application/json');
        res.send(preferences);
      })
      .catch(function(err) {
        res.send(err);
      });
  }

  /**
   * Receives User APNs Notification Preferences and updates it in Database
   * @param {object} req - request object
   * @param {object} res - response object
   */
  updatePrefSafari(req, res) {
    this.db.updatePreferencesSafari(req.body)
      .then(function() {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({data: {success: true}}));
      })
      .catch(function(err) {
        res.send(err);
      });
  }
}
module.exports = Notifications;
