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
    http.get('/get-request', (req, res) => res.json({ok: 1}));
    http.post('/post-request', (req, res) => res.json({ok: 1}));
  });
  it('GET with token should respond 200/JSON', (done) => {
    chai.request(http.getServer)
      .get('/api/get-request')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  it('GET with an incorrect token should respond 403', (done) => {
    chai.request(http.getServer)
      .get('/api/get-request')
      .query({token: 'wrong token'})
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  it('GET without a token should respond 403', (done) => {
    chai.request(http.getServer)
      .get('/api/get-request')
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  it('GET with an incorrect path should respond 404', (done) => {
    chai.request(http.getServer)
      .get('/api/get-wrong-request')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(res.status, 404);
        done();
      });
  });

  it('POST with correct token should respond 200/JSON', (done) => {
    chai.request(http.getServer)
      .post('/api/post-request')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  it('POST with an incorrect token should respond 403', (done) => {
    chai.request(http.getServer)
      .post('/api/post-request')
      .query({token: 'wrong token'})
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  after(() => {
    http.getServer.close();
  });
});
