/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const JsonFileConnector = require('../../lib/JSONFileConnector.js');

const CONFIG_FILE = path.join(__dirname, 'db.json.temp');

const TEST_CONTENT = {
  colsHeader: {
    date: {
      visible: true,
      size: 'cell-m'
    }, message: {
      visible: true,
      size: 'cell-s'
    }
  }
};

const NEW_CONTENT = {
  colsHeader: {
    date: {
      visible: false,
      size: 'cell-xl'
    }, message: {
      visible: false,
      size: 'cell-xl'
    }
  }
};

let jsonConfig;

describe('JSON file custom database', () => {
  before(() => {
    // Drop previous DB if exists
    try {
      fs.unlinkSync(CONFIG_FILE);
    } catch (error) { }
    jsonConfig = new JsonFileConnector(CONFIG_FILE);
  });

  describe('Creating a new profile', () => {
    it('should throw an error if username is undefined', () => {
      return assert.rejects(async () => {
        await jsonConfig.createNewProfile(undefined, TEST_CONTENT);
      }, new Error('[JSONConnector] username for profile is mandatory'));
    });

    it('should throw an error if username is null', () => {
      return assert.rejects(async () => {
        await jsonConfig.createNewProfile(null, TEST_CONTENT);
      }, new Error('[JSONConnector] username for profile is mandatory'));
    });

    it('should successfully create a new profile', () => {
      return assert.doesNotReject(async () => {
        await jsonConfig.createNewProfile('anonymous', TEST_CONTENT);
        const newProfile = await jsonConfig.getProfileByUsername('anonymous');

        assert.ok(newProfile.createdTimestamp);
        assert.ok(newProfile.lastModifiedTimestamp);
        assert.deepStrictEqual(newProfile.content, TEST_CONTENT);
        assert.strictEqual(newProfile.username, 'anonymous');
      });
    });

    it('should throw an error when creating a new profile with the username as an existing profile', () => {
      return assert.rejects(async () => {
        await jsonConfig.createNewProfile('anonymous', TEST_CONTENT);
      }, new Error('[JSONConnector] Profile with this username (anonymous) already exists'));
    });
  });

  describe('Get a profile by username', () => {
    it('should successfully get a profile by username', (done) => {
      jsonConfig.getProfileByUsername('anonymous').then((profile) => {
        assert.deepStrictEqual(profile.content, TEST_CONTENT);
        assert.strictEqual(profile.username, 'anonymous');
        done();
      }).catch(done);
    });

    it('should successfully return undefined if their is no profile associated to requested username', (done) => {
      jsonConfig.getProfileByUsername('no-user').then((profile) => {
        assert.strictEqual(profile, undefined);
        done();
      }).catch(done);
    });
  });

  describe('Update a profile by username', () => {
    it('should successfully update the content and lastModifiedTimestamp of a profile by username', (done) => {
      jsonConfig.getProfileByUsername('anonymous').then((profile) => {
        const lastTimestamp = profile.lastModifiedTimestamp;
        jsonConfig.updateProfile('anonymous', NEW_CONTENT).then((updatedProfile) => {
          assert.deepStrictEqual(updatedProfile.content, NEW_CONTENT);
          assert.strictEqual(updatedProfile.username, 'anonymous');
          assert.ok(updatedProfile.lastModifiedTimestamp > lastTimestamp);
          done();
        }).catch(done);
      });
    });

    it('should throw an error when trying to update a profile which does not exist', () => {
      return assert.rejects(async () => {
        await jsonConfig.updateProfile('no-one', TEST_CONTENT);
      }, new Error('[JSONConnector] Profile with this username (no-one) cannot be updated as it does not exist'));
    });
  });

  describe('Testing read/write to fs', () => {
    it('should reject when profiles are missing from data with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = '{}';
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`[JSONConnector] DB file should have an array of profiles ${CONFIG_FILE}`));
    });

    it('should reject when there is no data with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = '';
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`[JSONConnector] DB file should have an array of profiles ${CONFIG_FILE}`));
    });

    it('should reject when data.profiles is not an Array with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = {profiles: 'test'};
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`[JSONConnector] DB file should have an array of profiles ${CONFIG_FILE}`));
    });

    it('should successfully read profiles from data', async () => {
      return assert.doesNotReject(async () => {
        jsonConfig.data = {profiles: []};
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      });
    });

    it('should reject when there is missing data with error of bad JSON format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = undefined;
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new TypeError(`The "data" argument must be of type string or an instance of Buffer, TypedArray, or DataView. Received undefined`));
    });

    after(() => {
      fs.unlinkSync(CONFIG_FILE);
    });
  });
});

