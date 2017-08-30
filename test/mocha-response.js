const assert = require('assert');
const Response = require('./../websocket/response.js');

describe('response class', () => {
  it('create and verify instance', () => {
    const command = 'test-cmd';
    const code = 200;
    const payload = {message: 'test message'};
    const response = new Response(code).command(command).payload(payload);
    const json = response.json;

    assert.equal(json.command, command, 'Command value differes');
    assert.equal(json.code, code, 'Code values differes');
    assert.equal(json.payload.message, payload.message, 'Payload differes');
  });
});
