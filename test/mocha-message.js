const assert = require('assert');
const WebSocketMessage = require('./../websocket/message.js');

describe('Web Socket message', () => {
  it('create and verify instance', () => {
    const command = 'test-cmd';
    const code = 200;
    const payload = {message: 'test message'};
    const response = new WebSocketMessage(code).setCommand(command).setPayload(payload);
    const json = response.json;

    assert.equal(json.command, command);
    assert.equal(json.code, code);
    assert.equal(json.payload.message, payload.message);
  });

  it('parse message', () => {
    const message = {
      command: 'test',
      test: 'value',
      token: 'token'
    };
    new WebSocketMessage().parse(JSON.stringify(message))
      .then((res) => {
        assert.equal(res.getCommand(), message.command);
        assert.equal(res.getPayload().test, message.test);
        assert.equal(res.getToken(), message.token);
      }, () => {
        assert.fail('promise should be resolved');
      });
  });

  it('parse message without token', (done) => {
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
