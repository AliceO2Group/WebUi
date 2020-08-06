const assert = require('assert');
const fs = require('fs');
const path = require('path');
const SQLiteConnector = require('../../lib/SQLiteConnector.js');

describe('SQLite database', () => {
  before(() => {
    sqliteConnector = new SQLiteConnector(__dirname + 'INFOLOGGER;');
  });
  
  describe('Test Connection', () => {
    it('should successfully return a response', () => {
        return assert.doesNotReject(async () => {
            await sqliteConnector.testConnection('SELECT * FROM PROFILES LIMIT 1');
        });
    });
  });

  describe('Make Query', () => {
    it('should successfully get profile by username', (done) => {
        return assert.doesNotReject(async () => {
            sqliteConnector.query('SELECT * FROM profiles WHERE profile_name=?', ['users'], true).then((profile) => {
                log.info(profile.profile_id);
                assert.strictEqual(profile.profile_id, 1);
                done();
            }).catch(done);
        });
    });
    it('should successfully add a new profile', () => {
        return assert.doesNotReject(async () => {
            await sqliteConnector.query('INSERT INTO profiles(profile_name) VALUES(?)',['anonymous'],false);
            const newProfile = await sqliteConnector.query('SELECT * FROM profiles WHERE profile_name=?', ['anonymous'], false);
    
            assert.ok(newProfile.profile_id);
            assert.ok(newProfile.profile_name);
            assert.strictEqual(newProfile.profile_name, 'anonymous');
        });
    });
    it('should successfully delete a new profile', () => {
        return assert.doesNotReject(async () => {
            await sqliteConnector.query('DELETE FROM profiles WHERE profile_name=?',['anonymous'],false);
            const newProfile = await sqliteConnector.query('SELECT * FROM profiles WHERE profile_name=?', ['anonymous'], false);
    
            assert.notOk(newProfile.profile_id);
            assert.notOk(newProfile.profile_name);
        });
    });
  });
    after(() => {
      sqliteConnector.closeDatabase();
    });
});

