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

const {jwt} = require('../config-default.json');
const O2TokenService = require('./../services/O2TokenService.js');
const {JsonWebTokenError} = require('jsonwebtoken');
const assert = require('assert');

describe('JSON Web Token', () => {

  describe('O2TokenService Initialization', () => {
    it('should successfully initialize constructor with provided configuration', () => {
      const o2Token = new O2TokenService(jwt);
      assert.strictEqual(o2Token._expiration, jwt.expiration);
      assert.strictEqual(o2Token._maxAge, jwt.maxAge);
      assert.strictEqual(o2Token._secret, jwt.secret);
      assert.strictEqual(o2Token._issuer, jwt.issuer);
    });

    it('should successfully initialize constructor with provided configuration and fill in defaults', () => {
      const jwtConfig = {
        maxAge: '2m',
        issuer: 'alice-o2-gui',
        secret: null
      }
      const o2Token = new O2TokenService(jwtConfig);
      assert.strictEqual(o2Token._expiration, '1d');
      assert.strictEqual(o2Token._maxAge, jwtConfig.maxAge);
      assert.strictEqual(o2Token._secret.length, 512);
      assert.strictEqual(o2Token._issuer, jwtConfig.issuer);
    });
  });

  describe('O2TokenService "generateToken"', () => {
    it('should successfully generate token based on provided configuration', () => {
      const o2Token = new O2TokenService(jwt);
      const token = o2Token.generateToken(100, 'bob', 'John Bob', 'admin');
      const {id, username, name, access} = o2Token.verify(token);
      assert.strictEqual(id, 100);
      assert.strictEqual(username, 'bob');
      assert.strictEqual(name, 'John Bob');
      assert.strictEqual(access, 'admin');
    });

    it('should successfully generate token based on provided configuration and default parameters', () => {
      const o2Token = new O2TokenService(jwt);
      const token = o2Token.generateToken(101, 'alice', 'Alice O2');
      const {id, username, name, access} = o2Token.verify(token);
      assert.strictEqual(id, 101);
      assert.strictEqual(username, 'alice');
      assert.strictEqual(name, 'Alice O2');
      assert.strictEqual(access, '');
    });
  });

  describe('O2TokenService "verify"', () => {
    it('should successfully verify token', async () => {
      const o2Token = new O2TokenService(jwt);
      const token = o2Token.generateToken(100, 'bob', 'John Bob', 'admin');
      assert.doesNotThrow(() => o2Token.verify(token));

      const {id, username, name, access} = o2Token.verify(token);
      assert.strictEqual(id, 100);
      assert.strictEqual(username, 'bob');
      assert.strictEqual(name, 'John Bob');
      assert.strictEqual(access, 'admin');
    });

    it('should throw error if verify function fails', async () => {
      const o2Token = new O2TokenService(jwt);
      const token = o2Token.generateToken(101, 'alice', 'Alice O2');
      o2Token._secret = 'changed';
      assert.throws(() => o2Token.verify(token), new JsonWebTokenError('invalid signature'));
    });
  });
});
