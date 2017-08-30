const Database = require('./../http/db.js');
const mysql = require('mysql');
const chai = require('chai');
const assert = chai.assert;
const expect = chai.expect;
const log = require('./../log.js');

let db = undefined;

describe('Access to db', function() {
  before(function(done) {
    const con = mysql.createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: '',
      database: 'notifications'
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
        done();
      });
    });
  });

  it('should return true if db is running and connected', function(done) {
    db = new Database();
    done();
  });
});

describe('Insert Subscription', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
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
  });

  describe('#pass', function() {
    it('should successfully add subscription to Database', function() {
      let sub = {
        endpoint: 'test',
        keys: {
          auth: 'test',
          p256dh: 'test'
        }
      };

      return db.insertSubscription(sub)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});

describe('Update Preferences', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let data = {
        endpoint: undefined,
        preferences: undefined
      };

      assert.throws(() => {
        db.updatePreferences(data);
      }, Error, 'Invalid endpoint or preferences.');
    });
  });

  describe('#fail2', function() {
    it('should reject Promise', function() {
      let data = {
        endpoint: 'new',
        preferences: '111'
      };

      return db.updatePreferences(data)
        .then(function fullfilled(result) {
          throw new Error('Promise was unexpectedly fullfilled');
        }, function rejected(error) {
          assert.equal('No subscription exists with endpoint: new', error);
        });
    });
  });

  describe('#pass', function() {
    it('should successfully Update Preferences', function() {
      let data = {
        endpoint: 'test',
        preferences: '111'
      };
      return db.updatePreferences(data)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});


describe('Get Preferences', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let data = {
        endpoint: undefined
      };

      assert.throws(() => {
        db.getPreferences(data);
      }, Error, 'Invalid endpoint.');
    });
  });

  describe('#pass', function() {
    it('should successfully Update Preferences', function() {
      let data = {
        endpoint: 'test'
      };
      return db.getPreferences(data)
        .then(function(data) {
          expect(data).to.be.an('array');
        });
    });
  });
});


describe('Delete Subscription', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let endpoint = undefined;

      assert.throws(() => {
        db.deleteSubscription(endpoint);
      }, Error, 'Invalid endpoint.');
    });
  });

  describe('#pass', function() {
    it('should successfully delete subscription from Database', function() {
      let endpoint = 'test';

      return db.deleteSubscription(endpoint)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});

describe('Insert Safari Subscription', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let deviceToken = undefined;

      assert.throws(() => {
        db.insertSubscriptionSafari(deviceToken);
      }, Error, 'Invalid Device Token.');
    });
  });

  describe('#pass', function() {
    it('should successfully add subscription to Database', function() {
      let deviceToken = 'safariTest';

      return db.insertSubscriptionSafari(deviceToken)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});

describe('Update Safari Preferences', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let data = {
        deviceToken: undefined,
        preferences: undefined
      };

      assert.throws(() => {
        db.updatePreferencesSafari(data);
      }, Error, 'Invalid deviceToken or preferences.');
    });
  });

  describe('#fail2', function() {
    it('should reject Promise', function() {
      let data = {
        deviceToken: 'new',
        preferences: '111'
      };

      return db.updatePreferencesSafari(data)
        .then(function fullfilled(result) {
          throw new Error('Promise was unexpectedly fullfilled');
        }, function rejected(error) {
          assert.equal('No subscription exists with deviceToken: new', error);
        });
    });
  });

  describe('#pass', function() {
    it('should successfully Update Preferences', function() {
      let data = {
        deviceToken: 'safariTest',
        preferences: '111'
      };
      return db.updatePreferencesSafari(data)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});

describe('Get Safari Preferences', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let data = {
        deviceToken: undefined
      };

      assert.throws(() => {
        db.getPreferencesSafari(data);
      }, Error, 'Invalid deviceToken.');
    });
  });

  describe('#pass', function() {
    it('should successfully Update Preferences', function() {
      let data = {
        deviceToken: 'safariTest'
      };
      return db.getPreferencesSafari(data)
        .then(function(data) {
          expect(data).to.be.an('array');
        });
    });
  });
});

describe('Delete Safari Subscription', function() {
  describe('#fail', function() {
    it('should throw Error', function() {
      let deviceToken = undefined;

      assert.throws(() => {
        db.deleteSubscriptionSafari(deviceToken);
      }, Error, 'Invalid Device Token.');
    });
  });

  describe('#pass', function() {
    it('should successfully delete safari subscription from Database', function() {
      let deviceToken = 'safariTest';

      return db.deleteSubscriptionSafari(deviceToken)
        .then(function(data) {
          expect(data).to.equal(true);
        });
    });
  });
});
