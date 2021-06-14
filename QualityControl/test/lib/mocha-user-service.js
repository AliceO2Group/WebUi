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
const AssertionError = require('assert').AssertionError;
const sinon = require('sinon');

const UserService = require('../../lib/services/UserService.js');

describe('UserService test suite', () => {
  describe('Creating a new UserService instance', () => {
    it('should throw an error if it is missing data connector ', () => {
      assert.throws(() => new UserService(undefined),
        new AssertionError({message: 'Missing Data Connector', expected: true, operator: '=='}));
      assert.throws(() => new UserService(undefined),
        new AssertionError({message: 'Missing Data Connector', expected: true, operator: '=='}));
    });

    it('should successfully initialize UserService', () => {
      assert.doesNotThrow(() => new UserService({}));
    });
  });

  describe('Adding a new user to memory', () => {
    it('should successfully add a user and respond with status ok and code 200', async () => {
      const req = {session: {username: 'anon', name: 'User Anon', personid: 0}};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
      const dataCon = {addUser: sinon.stub().resolves()};
      const userService = new UserService(dataCon);
      await userService.addUser(req, res);
      assert.ok(res.status.calledWith(200), 'Response status was not 200');
      assert.ok(res.json.calledWith({ok: true}));
    });

    it('should respond with status 502 due to error in validating the user', async () => {
      const req = {session: {username: '', name: 'User Anon', personid: 0}};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
      const userService = new UserService({});
      await userService.addUser(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 200');
      assert.ok(res.json.calledWith({ok: false, message: 'Unable to add user to memory'}));
    });

    it('should respond with status 502 due to error in saving the user', async () => {
      const req = {session: {username: 'anon', name: 'User Anon', personid: 0}};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub()
      };
      const dataCon = {addUser: sinon.stub().rejects('Unable to save the user')};
      const userService = new UserService(dataCon);
      await userService.addUser(req, res);
      assert.ok(res.status.calledWith(502), 'Response status was not 200');
      assert.ok(res.json.calledWith({ok: false, message: 'Unable to add user to memory'}));
    });
  });

  describe('Helper methods', () => {
    let userService;
    before(() => userService = new UserService({}));

    it('should throw error due to missing username when calling validateUser()', () => {
      assert.throws(() => userService._validateUser(''), new Error('username of the user is mandatory'))
      assert.throws(() => userService._validateUser(), new Error('username of the user is mandatory'))
      assert.throws(() => userService._validateUser(undefined), new Error('username of the user is mandatory'))
      assert.throws(() => userService._validateUser(null), new Error('username of the user is mandatory'))
    });

    it('should throw error due to missing name when calling validateUser()', () => {
      assert.throws(() => userService._validateUser('username', ''), new Error('name of the user is mandatory'))
      assert.throws(() => userService._validateUser('username'), new Error('name of the user is mandatory'))
      assert.throws(() => userService._validateUser('username', undefined), new Error('name of the user is mandatory'))
      assert.throws(() => userService._validateUser('username', null), new Error('name of the user is mandatory'))
    });

    it('should throw error due to missing id when calling validateUser()', () => {
      assert.throws(() => userService._validateUser('username', 'name', ''), new Error('id of the user is mandatory'))
      assert.throws(() => userService._validateUser('username', 'name'), new Error('id of the user is mandatory'))
      assert.throws(() => userService._validateUser('username', 'name', undefined), new Error('id of the user is mandatory'));
      assert.throws(() => userService._validateUser('username', 'name', null), new Error('id of the user is mandatory'))
      assert.throws(() => userService._validateUser('username', 'name', 'test'), new Error('id of the user must be a number'))
    });

    it('should not throw error when all parameters are ok', () => {
      assert.doesNotThrow(() => userService._validateUser('username', 'name', 0));
      assert.doesNotThrow(() => userService._validateUser('username', 'name', 22));
    });
  });
});
