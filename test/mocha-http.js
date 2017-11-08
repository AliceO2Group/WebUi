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
    http.get('/test-with-auth', (req, res) => res.json({ok: 1}));
    http.getNoAuth('/test-without-auth', (req, res) => res.json({ok: 1}));
    http.post('/test-with-auth', (req, res) => res.json({ok: 1}));
    http.postNoAuth('/test-without-auth', (req, res) => res.json({ok: 1}));
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

  it('GET /api/test-with-auth with token should respond 200/JSON/{ok:1}', (done) => {
    chai.request(http.getServer)
      .get('/api/test-with-auth')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  it('GET /api/test-with-auth with wrong token should respond 403', (done) => {
    chai.request(http.getServer)
      .get('/api/test-with-auth')
      .query({token: 'wrong token'})
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  it('GET /api/test-without-auth should respond 200/JSON/{ok:1}', (done) => {
    chai.request(http.getServer)
      .get('/api/test-without-auth')
      .query()
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  it('POST /api/test-with-auth with token should respond 200/JSON/{ok:1}', (done) => {
    chai.request(http.getServer)
      .post('/api/test-with-auth')
      .query({token: token})
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  it('POST /api/test-with-auth with wrong token should respond 403', (done) => {
    chai.request(http.getServer)
      .post('/api/test-with-auth')
      .query({token: 'wrong token'})
      .end((err, res) => {
        assert.strictEqual(res.status, 403);
        done();
      });
  });

  it('POST /api/test-without-auth should respond 200/JSON/{ok:1}', (done) => {
    chai.request(http.getServer)
      .post('/api/test-without-auth')
      .query()
      .end((err, res) => {
        assert.strictEqual(err, null);
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.ok, 1);
        done();
      });
  });

  after(() => {
    http.getServer.close();
  });
});
