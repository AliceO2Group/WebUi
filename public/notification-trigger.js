const webpush = require('web-push');
const argv = require('yargs').argv;
const mysql = require('mysql');
const config = require('./../config.json');
const log = require('./../log.js');
const apn = require('apn');
const con = mysql.createConnection({
  host: config.pushNotifications.host,
  user: config.pushNotifications.user,
  password: config.pushNotifications.password,
  database: config.pushNotifications.database
});

/*

To run this file, use command:

node test/notification-trigger.js --type <type> --title "<title>" --message "<message>"

Replace <type> with 1, 2 or 3.
(If more types are added then use the corresponding number)

<title> and <message> should be replaced by the Title and Message of notification respectively.

*/

con.connect(function(err) {
  if (err) {
    throw err;
  }
});

/*
For using 'web-push' package you need to generate a VAPID Public and Private Key Pair.
You can generate the VAPID keys by 2 methods
1. By using 'web-push' package from the terminal.
  ./node_modules/web-push/src/cli.js generate-vapid-keys

2. By going to Google CodeLab - https://web-push-codelab.appspot.com/
(Use Chrome or Mozilla, not Safari)
*/
const vapidKeys = {
  publicKey: config.pushNotifications.vapid.publicKey,
  privateKey: config.pushNotifications.vapid.privateKey
};

webpush.setVapidDetails(
  'mailto: ' + config.pushNotifications.vapid.email,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Sends push notifications to subscribed users
 * @param {object} subscription - Subscription object with user endpoint
 * @param {string} dataToSend - String message to be sent in notification
 * @return {promise} webpush.sendNotification - Sends Notification
 */
function triggerPushMsg(subscription, dataToSend) {
  return webpush.sendNotification(subscription, dataToSend)
    .catch((err) => {
      if (err.statusCode === 410) {
        return deleteSubscriptionFromDatabase(subscription.endpoint);
      } else {
        log.warn('Subscription is no longer valid: ', err);
      }
    });
}

/**
 * Deletes user subscriptions from Database
 * @param {string} endpoint - URL to identify each user
 * @return {promise}
 */
function deleteSubscriptionFromDatabase(endpoint) {
  let sql = 'DELETE FROM subscriptions WHERE endpoint = ?';

  return new Promise(function(resolve, reject) {
    con.query(sql, [endpoint], function(err, result) {
      if (err) {
        throw reject(err);
      }
      log.debug('Deleted successfully from database. endpoint: ', endpoint);
      resolve(true);
    });
  });
}

/**
 * Fetches subscriptions from Database
 * @return {promise}
 */
function getSubscriptions() {
  let sql = 'SELECT * FROM subscriptions WHERE deviceToken IS NULL';

  return new Promise(function(resolve, reject) {
    con.query(sql, function(err, result) {
      if (err) {
        throw reject(err);
      }
      resolve(result);
    });
  });
}

/**
 * Fetches APN subscriptions from Database
 * @return {promise}
 */
function getAPNSubscriptions() {
  let sql = 'SELECT * FROM subscriptions WHERE endpoint IS NULL';

  return new Promise(function(resolve, reject) {
    con.query(sql, function(err, result) {
      if (err) {
        throw reject(err);
      }
      resolve(result);
    });
  });
}

/**
 * Formats the subscription to a suitable format to be sent to 'web-push' server
 * @param {object} sub - Subscription object fetched from Database
 * @return {object} formattedSubscription - Subscription object reformatted
 */
function formatSubscription(sub) {
  let formattedSubscription = {
    'id': sub.sub_id,
    'endpoint': sub.endpoint,
    'keys': {
      'p256dh': sub.p256dh_key,
      'auth': sub.auth_key
    },
    'preferences': sub.preferences
  };
  return formattedSubscription;
}

/**
 * Fetches subscriptions from db then verifies them and sends notifications.
 * @return {promise}
 */
function sendNotif() {
  const type = argv.type;
  const dataToSend = {
    'title': argv.title,
    'message': argv.message
  };

  return getSubscriptions()
    .then(function(subscriptions) {
      let promiseChain = Promise.resolve();

      for (let i = 0; i < subscriptions.length; i++) {
        let subscription = subscriptions[i];
        subscription = formatSubscription(subscription);

        let pref = subscription.preferences.split('');

        if (pref[type - 1] == 1) {
          promiseChain = promiseChain.then(() => {
            return triggerPushMsg(subscription, JSON.stringify(dataToSend));
          });
        }
      }

      return promiseChain;
    })
    .then(() => {
      sendAPNNotif();
    })
    .catch(function(err) {
      throw err;
    });
}

/**
 * Fetches APN subscriptions from db then verifies them and sends notifications.
 * @return {promise}
 */
function sendAPNNotif() {
  const type = argv.type;
  let options = {
    token: {
      key: config.pushNotifications.APN.authenticationToken,
      keyId: config.pushNotifications.APN.keyId,
      teamId: config.pushNotifications.APN.teamId
    },
    production: true
  };
  let apnProvider = new apn.Provider(options);
  let note = new apn.Notification();

  note.expiry = Math.floor(Date.now() / 1000) + 3600;
  note.badge = 3;
  note.sound = 'ping.aiff';
  note.payload = {
    from: 'AliceO2 Control'
  };
  note.urlArgs = [];
  note.body = argv.message;
  note.title = argv.title;
  note.topic = config.pushNotifications.APN.pushId;

  return getAPNSubscriptions()
    .then(function(subscriptions) {
      let promiseChain = Promise.resolve();

      for (let i = 0; i < subscriptions.length; i++) {
        let subscription = subscriptions[i];

        let pref = subscription.preferences.split('');
        let deviceToken = subscription.deviceToken;

        if (pref[type - 1] == 1) {
          promiseChain = promiseChain.then(() => {
            return apnProvider.send(note, deviceToken);
          });
        }
      }

      return promiseChain;
    })
    .then(() => {
      apnProvider.shutdown();
      con.end();
    })
    .catch(function(err) {
      throw err;
    });
}

sendNotif();
