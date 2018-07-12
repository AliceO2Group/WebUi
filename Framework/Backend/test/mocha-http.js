process.env.NODE_ENV = 'test';

const assert = require('assert');
const path = require('path');
const http = require('http');
const url = require('url');
const config = require('./../config-default.json');
const JwtToken = require('./../jwt/token.js');
const HttpServer = require('./../http/server');

// as CERN cerfiticates are not signed by any CA
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let httpServer;
const jwt = new JwtToken(config.jwt);
const token = jwt.generateToken(0, 'test', 1);

describe('REST API', () => {
  before(() => {
    httpServer = new HttpServer(config.http, config.jwt);
    httpServer.get('/get-request', (req, res) => res.json({ok: 1}));
    httpServer.post('/post-request', (req, res) => res.json({ok: 1}));
    httpServer.post('/post-with-body', (req, res) => res.json({body: req.body}));
  });

  it('GET the "/" and return user details', (done) => {
    http.get('http://localhost:' + config.http.port + '/',
      (res) => {
        assert.strictEqual(res.statusCode, 302);
        const parsedUrl = new url.URL(res.headers.location, 'http://localhost');
        parsedUrl.searchParams.has('personid');
        parsedUrl.searchParams.has('name');
        parsedUrl.searchParams.has('token');
        done();
      }
    );
  });

  it('GET with token should respond 200/JSON', (done) => {
    http.get('http://localhost:' + config.http.port + '/api/get-request?token=' + token,
      (res) => {
        assert.strictEqual(res.statusCode, 200);
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          const parsedData = JSON.parse(rawData);
          assert.strictEqual(parsedData.ok, 1);
          done();
        });
      }
    );
  });

  it('GET with an incorrect token should respond 403', (done) => {
    http.get('http://localhost:' + config.http.port + '/api/get-request?token=wrong',
      (res) => {
        assert.strictEqual(res.statusCode, 403);
        done();
      }
    );
  });

  it('GET without a token should respond 403', (done) => {
    http.get('http://localhost:' + config.http.port + '/api/get-request',
      (res) => {
        assert.strictEqual(res.statusCode, 403);
        done();
      }
    );
  });

  it('GET with an incorrect path should respond 404', (done) => {
    http.get('http://localhost:' + config.http.port + '/api/get-wrong?token=' + token,
      (res) => {
        assert.strictEqual(res.statusCode, 404);
        done();
      }
    );
  });

  it('POST with a token should respond 200/JSON', (done) => {
    const req = http.request({
      hostname: 'localhost',
      port: config.http.port,
      path: '/api/post-request?token=' + token,
      method: 'POST'
    }, (res) => {
      assert.strictEqual(res.statusCode, 200);
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        const parsedData = JSON.parse(rawData);
        assert.strictEqual(parsedData.ok, 1);
        done();
      });
    });
    req.end();
  });

  it('POST with a JSON body', (done) => {
    const postData = {fake: 'message'};
    const postDataString = JSON.stringify(postData);
    const req = http.request({
      hostname: 'localhost',
      port: config.http.port,
      path: '/api/post-with-body?token=' + token,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postDataString)
      }
    }, (res) => {
      let rawData = '';
      res.on('data', (chunk) => {
        rawData += chunk;
      });
      res.on('end', () => {
        const parsedData = JSON.parse(rawData);
        assert.deepStrictEqual(parsedData.body, postData);
        done();
      });
    });
    req.write(postDataString);
    req.end();
  });

  it('POST with an incorrect token should respond 403', (done) => {
    const req = http.request({
      hostname: 'localhost',
      port: config.http.port,
      path: '/api/post-request?token=wrong',
      method: 'POST'
    }, (res) => {
      assert.strictEqual(res.statusCode, 403);
      done();
    });
    req.end();
  });
});

describe('HTTP server', () => {
  after(() => {
    httpServer.getServer.close();
  });

  it('Add and verify custom static path', (done) => {
    httpServer.addStaticPath(path.join(__dirname, 'mocha-http.js'), 'mocha-http');
    http.get('http://localhost:' + config.http.port + '/mocha-http',
      (res) => {
        assert.strictEqual(res.statusCode, 200);
        done();
      }
    );
  });

  it('Add custom static path that does not exist', (done) => {
    try {
      httpServer.addStaticPath(path.join(__dirname, 'does-not-exist'), 'does-not-exist');
    } catch (error) {
      done();
    }
  });
});
