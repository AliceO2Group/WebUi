const config = require('./../config.json');
const JwtToken = require('./../jwt/token.js');

describe('json web token', () => {
  let verified;
  const username = 'test';
  const id = 1111;
  const access = 1;

  afterEach(() => {
    if (verified.id !== id) {
      throw new Error('id does not match');
    }
    if (verified.username !== username) {
      throw new Error('username does not match');
    }
    if (verified.access !== access) {
      throw new Error('access level does not match');
    }
  });

  it('should generate and verify token', () => {
    const jwt = new JwtToken(config.jwt);
    const token = jwt.generateToken(id, username, access);
    verified = jwt.verify(token);
  });

  it('should refresh token', (done) => {
    const jwt = new JwtToken(config.jwt);
    const token = jwt.generateToken(id, username, access);
    setTimeout(() => {
      const newtoken = jwt.refreshToken(token);
      verified = jwt.verify(newtoken);
      done();
    }, 1200);
  });
});
