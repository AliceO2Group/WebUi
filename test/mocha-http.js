process.env.NODE_ENV = 'test';

const assert = require('assert');
const config = require('./../config.json');
const JwtToken = require('./../jwt/token.js');
const chai = require('chai');
const chaiHttp = require('chai-http');
const HttpServer = require('./../http/server');

// as CERN cerfiticates are not signed by any CA
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
chai.use(chaiHttp);

let http;
const jwt = new JwtToken(config.jwt);
const token = jwt.generateToken(0, 'test', 1);

describe('rest-api', () => {
  before(() => {
    http = new HttpServer(config.http, config.jwt, config.oAuth);
  });
  it('should respond 403 as no token provided', (done) => {
    chai.request(http.getServer)
      .get('/api/runs')
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  it('should respond 200/JSON', (done) => {
    chai.request(http.getServer)
      .get('/api/runs')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        done();
      });
  });

  it('should respond 404', (done) => {
    chai.request(http.getServer)
      .get('/api/runs1')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(res.status, 404);
        done();
      });
  });
  after(() => {
    http.getServer.close();
  });
});
