const config = require('./../config.json');
const JwtToken = require('./../jwt/token.js');
const assert = require('assert');

describe('JSON Web Token', () => {
  let verified;
  const username = 'test';
  const id = 1111;
  const access = 1;

  afterEach(() => {
    assert.strictEqual(verified.id, id);
    assert.strictEqual(verified.username, username);
    assert.strictEqual(verified.access, access);
  });

  it('Generate and verify token', (done) => {
    const jwt = new JwtToken(config.jwt);
    const token = jwt.generateToken(id, username, access);
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
    const token = jwt.generateToken(id, username, access);
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
