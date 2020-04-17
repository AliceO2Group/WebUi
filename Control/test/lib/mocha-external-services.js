const api = require('./../../lib/api.js');
const assert = require('assert');
const nock = require('nock');

describe('Control Service test suite', () => {
  it('should throw error due to null ControlProxy dependency', async () => {
    nock('http://localhost:8500')
      .get('/v1/kv/test/o2/hardware/flps/?keys=true')
      .reply(200, ['a']);
    const t = await api.getFLPs();
    console.log(t);
  });
});
