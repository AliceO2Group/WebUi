const Database = require('./../http/notifications-db.js');
const mysql = require('mysql');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const config = require('./../config.json');
const log = require('./../log.js');

let db = null;

describe('Test notification database', function() {
  before(function(done) {
    const con = mysql.createConnection({
      host: config.pushNotifications.host,
      user: config.pushNotifications.user,
      password: config.pushNotifications.password,
      database: config.pushNotifications.database
    });

    con.connect(function(err) {
      if (err) {
        throw err;
      }
      log.debug('Connected to the database');

      const sql = 'CREATE TABLE IF NOT EXISTS `subscriptions` (' +
        '`sub_id` int(11) unsigned NOT NULL AUTO_INCREMENT,' +
        '`endpoint` varchar(300) DEFAULT NULL,' +
        '`auth_key` varchar(200) DEFAULT NULL,' +
        '`p256dh_key` varchar(200) DEFAULT NULL,' +
        '`deviceToken` varchar(100) DEFAULT NULL,' +
        '`preferences` varchar(20) NOT NULL DEFAULT \'000\',' +
        'PRIMARY KEY (`sub_id`)' +
        ') ENGINE=MyISAM DEFAULT CHARSET=utf8;';

      con.query(sql, function(err, result) {
        if (err) {
          throw err;
        }
        log.debug('Table Created');
        con.end();
        db = new Database(config.pushNotifications);
        done();
      });
    });
  });

  it('Fail to insert subscription to the database', function() {
    let sub = {
      endpoint: undefined,
      keys: {
        auth: undefined,
        p256dh: undefined
      }
    };
    assert.throws(() => {
      db.insertSubscription(sub);
    }, Error, 'Invalid subscription object.');
  });

  it('Successfully add subscription to database', function() {
    let sub = {
      endpoint: 'test',
      keys: {
        auth: 'test',
        p256dh: 'test'
      }
    };
    return db.insertSubscription(sub)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  it('Fail to update prefernces - invalid preferences', function() {
    let data = {
      endpoint: undefined,
      preferences: undefined
    };

    assert.throws(() => {
      db.updatePreferences(data);
    }, Error, 'Invalid endpoint or preferences.');
  });

  it('Fail to update prefernces - promise rejection', function() {
    let data = {
      endpoint: 'new',
      preferences: '111'
    };

    return db.updatePreferences(data)
      .then(function fullfilled(result) {
        expect(result.affectedRows).to.equal(0);
      }, function rejected(error) {
        assert.equal('No subscription exists with endpoint: new', error);
      });
  });

  it('Successfully update preferences', function() {
    let data = {
      endpoint: 'test',
      preferences: '111'
    };
    return db.updatePreferences(data)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  it('Fail to get preferences', function() {
    let data = {
      endpoint: undefined
    };

    assert.throws(() => {
      db.getPreferences(data);
    }, Error, 'Invalid endpoint.');
  });

  it('Successfully update preferences', function() {
    let data = {
      endpoint: 'test'
    };
    return db.getPreferences(data)
      .then(function(data) {
        expect(data).to.be.an('array');
      });
  });

  it('Fail to delete subscription', function() {
    let endpoint = undefined;
    assert.throws(() => {
      db.deleteSubscription(endpoint);
    }, Error, 'Invalid endpoint.');
  });

  it('Successfully delete subscription from database', function() {
    let endpoint = 'test';

    return db.deleteSubscription(endpoint)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  it('Fail to insert Safari subscription', function() {
    let deviceToken = undefined;

    assert.throws(() => {
      db.insertSubscriptionSafari(deviceToken);
    }, Error, 'Invalid Device Token.');
  });

  it('Successfully add subscription to database', function() {
    let deviceToken = 'safariTest';

    return db.insertSubscriptionSafari(deviceToken)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  it('Fail to update Safari preferences', function() {
    let data = {
      deviceToken: undefined,
      preferences: undefined
    };

    assert.throws(() => {
      db.updatePreferencesSafari(data);
    }, Error, 'Invalid deviceToken or preferences.');
  });

  it('Fail to update Safari preferences - promise rejection', function() {
    let data = {
      deviceToken: 'new',
      preferences: '111'
    };

    return db.updatePreferencesSafari(data)
      .then(function fullfilled(result) {
        expect(result.affectedRows).to.equal(0);
      }, function rejected(error) {
        assert.equal('No subscription exists with deviceToken: new', error);
      });
  });

  it('Successfully update Safari preferences', function() {
    let data = {
      deviceToken: 'safariTest',
      preferences: '111'
    };
    return db.updatePreferencesSafari(data)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  it('Fail to get Safari preferences', function() {
    let data = {
      deviceToken: undefined
    };

    assert.throws(() => {
      db.getPreferencesSafari(data);
    }, Error, 'Invalid deviceToken.');
  });

  it('Successfully update Safari preferences', function() {
    let data = {
      deviceToken: 'safariTest'
    };
    return db.getPreferencesSafari(data)
      .then(function(data) {
        expect(data).to.be.an('array');
      });
  });

  it('Fail to delete Safari subscription', function() {
    let deviceToken = undefined;

    assert.throws(() => {
      db.deleteSubscriptionSafari(deviceToken);
    }, Error, 'Invalid Device Token.');
  });

  it('Successfully delete Safari subscription from database', function() {
    let deviceToken = 'safariTest';
    return db.deleteSubscriptionSafari(deviceToken)
      .then(function(data) {
        expect(data.affectedRows).to.equal(1);
      });
  });

  after(function() {
    db.close();
  });
});
