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
const sinon = require('sinon');
const config = require('./../config-default.json');
const OpenId = require('./../http/openid.js');
const server = require('./../http/server.js');

describe('OpenID Connect client', () => {
  it('should fail to create instance', async () => {
    const openid = new OpenId(config.openId);
    await assert.rejects(async () => await openid.createIssuer());
  }).timeout(5500);
});

describe('Logout', () => {
  it('should successfully call OpenId service for logout', async () => {
    // Create a mock for the OpenId service
    const openidMock = {
      getLogoutUrl: sinon.stub().returns('http://mock-end-session-url?client_id=mock-client-id&post_logout_redirect_uri=http://info.cern.ch')
    };

    server.openid = openidMock;

    const response = await server.logout(); 

    sinon.assert.calledOnce(openidMock.getLogoutUrl);

    assert.strictEqual(response.logoutUrl, 'http://mock-end-session-url?client_id=mock-client-id&post_logout_redirect_uri=http://info.cern.ch');
  }).timeout(5500);
  
  it('should return the correct logout URL', async () => {
    const openid = new OpenId(config.openId);

    // Mock the client and its endSessionUrl method
    const mockClient = {
      endSessionUrl: sinon.stub().returns('http://mock-end-session-url'),
      id: 'mock-client-id'
    };
    openid.client = mockClient;

    const logoutUrl = openid.getLogoutUrl();
    sinon.assert.calledOnce(mockClient.endSessionUrl);

    // Assert that getLogoutUrl returns the expected string
    const expectedUrl = 'http://mock-end-session-url?client_id=mock-client-id&post_logout_redirect_uri=http://info.cern.ch'
    assert.strictEqual(logoutUrl, expectedUrl);
  }).timeout(5500);
});