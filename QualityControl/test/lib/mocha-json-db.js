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

/* eslint-disable max-len */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const JsonFileConnector = require('../../lib/JsonFileConnector.js');

const CONFIG_FILE = path.join(__dirname, 'db.json.temp');

const TEST_LAYOUT = {
  id: 123,
  name: 'test',
  owner_name: 'tests-boss',
  owner_id: 1
};

let jsonConfig;

describe('JSON file custom database', () => {
  before(() => {
    // Drop previous DB if exists
    try {
      fs.unlinkSync(CONFIG_FILE);
    } catch (error) {}
    jsonConfig = new JsonFileConnector(CONFIG_FILE);
  });

  describe('Creating a new Layout', () => {
    it('should throw an error if layout id is not provided', () => {
      return assert.rejects(async () => {
        await jsonConfig.createLayout({});
      }, new Error('layout id is mandatory'));
    });

    it('should throw an error if layout id is not provided', () => {
      return assert.rejects(async () => {
        await jsonConfig.createLayout({id: 'id'});
      }, new Error('layout name is mandatory'));
    });

    it('should successfully create a new layout', () => {
      return assert.doesNotReject(async () => {
        await jsonConfig.createLayout(TEST_LAYOUT);
        const createdLayout = await jsonConfig.readLayout(TEST_LAYOUT.id);
        assert.deepStrictEqual(jsonConfig.data.layouts.length, 1);
        assert.deepStrictEqual(createdLayout, TEST_LAYOUT);
      });
    });

    it('should throw an error when creating a new layout with the same id as an existing layout', () => {
      return assert.rejects(async () => {
        await jsonConfig.createLayout(TEST_LAYOUT);
      }, new Error('layout with this id (123) already exists'));
    });

    it('should successfully create a layout with the same name but different ID', () => {
      const layout = JSON.parse(JSON.stringify(TEST_LAYOUT));
      layout.id = 321;
      return assert.doesNotReject(async () => {
        await jsonConfig.createLayout(layout);
        const createdLayout = await jsonConfig.readLayout(layout.id);
        assert.deepStrictEqual(jsonConfig.data.layouts.length, 2);
        assert.deepStrictEqual(createdLayout, layout);
      });
    });
  });

  describe('Reading/Updating/Deleting a Layout', () => {
    it('should successfully read a layout by id', (done) => {
      jsonConfig.readLayout(TEST_LAYOUT.id).then((layout) => {
        assert.deepStrictEqual(TEST_LAYOUT, layout);
        done();
      }).catch(done);
    });

    it('should throw an error if no layout was found by an id', () => {
      return assert.rejects(async () => {
        await jsonConfig.readLayout(111);
      }, new Error('layout (111) not found'));
    });

    it('should throw an error when trying to update an inexistent layout by id', () => {
      return assert.rejects(async () => {
        await jsonConfig.updateLayout(111, TEST_LAYOUT);
      }, new Error('layout (111) not found'));
    });

    it('should successfully update an existing layout by id with a new name', () => {
      TEST_LAYOUT.name = 'Updated Name';
      return assert.doesNotReject(async () => {
        const updatedLayoutId = await jsonConfig.updateLayout(TEST_LAYOUT.id, TEST_LAYOUT);
        assert.deepStrictEqual(updatedLayoutId, TEST_LAYOUT.id);
        const updatedLayout = await jsonConfig.readLayout(TEST_LAYOUT.id);
        assert.deepStrictEqual(TEST_LAYOUT.name, updatedLayout.name);
      });
    });

    it('should throw an error when trying to delete an inexistent layout by id', () => {
      return assert.rejects(async () => {
        await jsonConfig.deleteLayout(111, TEST_LAYOUT);
      }, new Error('layout (111) not found'));
    });

    it('should successfully delete a layout by id', () => {
      return assert.doesNotReject(async () => {
        const removedLayoutId = await jsonConfig.deleteLayout(TEST_LAYOUT.id);
        assert.deepStrictEqual(removedLayoutId, TEST_LAYOUT.id);
      });
    });
  });

  describe('Listing all existing layouts', () => {
    it('should successfully list all existing layouts with no filter', () => {
      return assert.doesNotReject(async () => {
        const layouts = await jsonConfig.listLayouts();
        const expectedLayouts = [{id: 321, name: 'test', owner_name: 'tests-boss', owner_id: 1}];
        assert.deepStrictEqual(expectedLayouts, layouts);
      });
    });

    it('should successfully list all existing layouts based on give filter', () => {
      return assert.doesNotReject(async () => {
        const layouts = await jsonConfig.listLayouts({owner_id: ''});
        const expectedLayouts = [];
        assert.deepStrictEqual(expectedLayouts, layouts);
      });
    });
  });

  describe('Adding a new user to memory', () => {
    it('should successfully add a user if parameter is correct', async () => {
      assert.ok(jsonConfig.data.users.length === 0);
      const user = {id: 0, username: 'anon', name: 'name anon'};
      await jsonConfig.addUser(user);
      assert.ok(jsonConfig.data.users.length === 1);
    });

    it('should throw error if user object is not validated', async () => {
      assert.ok(jsonConfig.data.users.length === 1);
      const user = {username: 'anon', name: 'name anon'};
      assert.throws( () => jsonConfig.addUser(user), new Error('Field id is mandatory'));
      assert.ok(jsonConfig.data.users.length === 1);
    });

    it('should NOT add a user if user is already in memory', async () => {
      assert.ok(jsonConfig.data.users.length === 1);
      const user = {id: 0, username: 'anon', name: 'name anon'};
      await jsonConfig.addUser(user);
      assert.ok(jsonConfig.data.users.length === 1)
    });
  });

  describe('Testing read/write to fs', () => {
    it('should reject when layouts are missing from data with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = '{}';
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`DB file should have an array of layouts ${CONFIG_FILE}`));
    });

    it('should reject when there is no data with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = '';
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`DB file should have an array of layouts ${CONFIG_FILE}`));
    });

    it('should reject when data.layouts is not an Array with error of bad data format ', async () => {
      return assert.rejects(async () => {
        jsonConfig.data = {layouts: 'test'};
        await jsonConfig._writeToFile();
        await jsonConfig._readFromFile();
      }, new Error(`DB file should have an array of layouts ${CONFIG_FILE}`));
    });

    it('should resolve and add an arrau of users if missing from data', async () => {
      jsonConfig.data = {layouts: []};
      await jsonConfig._writeToFile();
      await jsonConfig._readFromFile();
      assert.ok(jsonConfig.data.users.length === 0);
    });

    it('should successfully read layouts from data', async () => {
      return assert.doesNotReject(async () => {
        jsonConfig.data = {layouts: []};
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

  describe('Helper validateUser', () => {
    it('should throw error due to missing user object', () => {
      assert.throws(() => jsonConfig._validateUser(''), new Error('User Object is mandatory'))
      assert.throws(() => jsonConfig._validateUser(), new Error('User Object is mandatory'))
      assert.throws(() => jsonConfig._validateUser(undefined), new Error('User Object is mandatory'))
      assert.throws(() => jsonConfig._validateUser(null), new Error('User Object is mandatory'))
    });

    it('should throw error due to missing usernamename', () => {
      assert.throws(() => jsonConfig._validateUser({id: 0}), new Error('Field username is mandatory'))
      assert.throws(() => jsonConfig._validateUser({name: 'User Anon'}), new Error('Field username is mandatory'))
      assert.throws(() => jsonConfig._validateUser({name: 'user', id: 0}), new Error('Field username is mandatory'))
    });

    it('should throw error due to missing name', () => {
      assert.throws(() => jsonConfig._validateUser({username: 'User Anon'}), new Error('Field name is mandatory'))
      assert.throws(() => jsonConfig._validateUser({username: 'user', id: 0}), new Error('Field name is mandatory'))
    });

    it('should throw error due to missing or invalid id', () => {
      assert.throws(() => jsonConfig._validateUser({username: 'username', name: 'user anon'}), new Error('Field id is mandatory'))
      assert.throws(() => jsonConfig._validateUser({username: 'username', name: 'user anon', id: 'string'}), new Error('Field id must be a number'))
    });

    it('should not throw error when all fields present are ok', () => {
      assert.doesNotThrow(() => jsonConfig._validateUser({username: 'username', name: 'name', id: 0}));
      assert.doesNotThrow(() => jsonConfig._validateUser({username: 'username', name: 'name', id: 22}));
    });
  });
});

