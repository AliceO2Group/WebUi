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
const { AssertionError } = require('assert');
const sinon = require('sinon');
const config = require('./../config-default.json');
const OpenId = require('./../http/openid.js');

describe('OpenID Connect client', () => {
  it('should fail to create instance', async () => {
    const openid = new OpenId(config.openId);
    await assert.rejects(async () => await openid.createIssuer());
  }).timeout(5500);

  it('should throw assertion error for missing critical configuration value, end_session_endpoint', () => {
    assert.throws(() => {
      new OpenId({
        secret: '<secret>',
        id: '<id>',
        redirect_uri: 'https://redirect.uri/callback',
        well_known: 'http://localhost/.well-known/openid-configuration',
      });
    }, new AssertionError({ message: 'Missing config value: end_session_endpoint', expected: true, operator: '==' }));
  });

  it('should successfully add default value for post_logout_redirect_uri', () => {
    const openid = new OpenId({
      secret: '<secret>',
      id: '<id>',
      redirect_uri: 'https://redirect.uri/callback',
      well_known: 'http://localhost/.well-known/openid-configuration',
      end_session_endpoint: 'http://localhost/end-session',
    });
    assert.strictEqual(openid.config.postLogoutRedirectUri, 'https://ali-flp.cern.ch/');
  });
});

describe('Logout', () => {
  it('should successfully return the correct logout URL from client of openid', async () => {
    const openid = new OpenId(config.openId);

    // Mock the client and its endSessionUrl method
    const mockClient = {
      endSessionUrl: sinon.stub().returns('http://mock-end-session-url'),
      id: 'mock-client-id',
    };
    openid.client = mockClient;

    const logoutUrl = openid.getLogoutUrl();

    // Assert that getLogoutUrl returns the expected string
    const expectedUrl = 'http://mock-end-session-url?client_id=mock-client-id&post_logout_redirect_uri=https://ali-flp.cern.ch/';
    assert.strictEqual(logoutUrl, expectedUrl);
    assert.ok(mockClient.endSessionUrl.calledOnce);
  }).timeout(5500);
});
