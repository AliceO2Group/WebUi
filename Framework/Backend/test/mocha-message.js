/**
 * @license
 * Copyright CERN and copyright holders of ALICE O2. This software is
 * distributed under the terms of the GNU General Public License v3 (GPL
 * Version 3), copied verbatim in the file "COPYING".
 *
 * See http://alice-o2.web.cern.ch/license for full licensing information.
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
*/

const assert = require('assert');
const WebSocketMessage = require('./../websocket/message.js');

describe('WebSocket message', () => {
  it('Create and verify message instance', () => {
    const command = 'test-cmd';
    const code = 200;
    const payload = {message: 'test message'};
    const response = new WebSocketMessage(code).setCommand(command).setPayload(payload);
    const json = response.json;

    assert.equal(json.command, command);
    assert.equal(json.code, code);
    assert.equal(json.payload.message, payload.message);
  });

  it('Parse message', () => {
    const message = {
      command: 'test',
      payload: {test: 'value'},
      token: 'token'
    };
    new WebSocketMessage().parse(JSON.stringify(message))
      .then((res) => {
        assert.equal(res.getCommand(), message.command);
        assert.equal(res.getPayload().test, message.payload.test);
        assert.equal(res.getToken(), message.token);
      }, () => {
        assert.fail('promise should be resolved');
      });
  });

  it('Parse invalid message without token', (done) => {
    const message = {
      command: 'test',
      test: 'value'
    };
    new WebSocketMessage().parse(JSON.stringify(message))
      .then(() => {
        assert.fail('promise should be rejected');
      }, () => {
        done();
      });
  });
});
