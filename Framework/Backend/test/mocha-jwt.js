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

const config = require('./../config-default.json');
const JwtToken = require('./../jwt/token.js');
const assert = require('assert');

describe('JSON Web Token', () => {
  let verified;
  const username = 'test';
  const name = 'Test';
  const id = 1111;
  const access = ['admin'];

  afterEach(() => {
    assert.strictEqual(verified.id, id);
    assert.strictEqual(verified.username, username);
    assert.deepStrictEqual(verified.access, access);
    assert.strictEqual(verified.name, name);
  });

  it('Generate and verify token', (done) => {
    const jwt = new JwtToken(config.jwt);
    const token = jwt.generateToken(id, username, name, access);
    jwt.verify(token)
      .then((decoded) => {
        verified = decoded;
        done();
      }, (err) => {
        assert.fail('verify() promise rejection: ' + err.message);
      });
  });

  it('Refresh token', (done) => {
    const jwt = new JwtToken(config.jwt);
    const token = jwt.generateToken(id, username, name, access);
    jwt.refreshToken(token)
      .then((data) => {
        jwt.verify(data.newToken)
          .then((decoded) => {
            verified = decoded;
            done();
          }, (err) => {
            assert.fail('verify() promise rejection: ' + err.message);
          });
      }, (err) => {
        assert.fail('refreshToken() promise rejection: ' + err.message);
      });
  });
});
