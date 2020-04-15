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

process.env.NODE_ENV = 'test';

const request = require('supertest');
const path = require('path');
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
    httpServer.put('/put-request', (req, res) => res.json({ok: 1}));
    httpServer.patch('/patch-request', (req, res) => res.json({ok: 1}));
    httpServer.delete('/delete-request', (req, res) => res.json({ok: 1}));
  });

  it('GET the "/" and return user details', (done) => {
    request(httpServer)
      .get('/')
      .expect(302)
      .end((err, res) => {
        if (err) {
          done(err);
          return;
        }

        const parsedUrl = new url.URL(res.headers.location, 'http://localhost');
        parsedUrl.searchParams.has('personid');
        parsedUrl.searchParams.has('name');
        parsedUrl.searchParams.has('token');
        done();
      });
  });

  it('GET with token should respond 200/JSON', (done) => {
    request(httpServer)
      .get('/api/get-request?token=' + token)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ok: 1}, done);
  });

  it('GET with an incorrect token should respond 403', (done) => {
    request(httpServer)
      .get('/api/get-request?token=wrong')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('GET without a token should respond 403', (done) => {
    request(httpServer)
      .get('/api/get-request')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('GET with an incorrect path should respond 404', (done) => {
    request(httpServer)
      .get('/api/get-wrong?token=' + token)
      .expect(404, done);
  });

  describe('404 handler', () => {
    it('GET with an incorrect path should respond 404, response should be JSON for API', (done) => {
      request(httpServer)
        .get('/api/get-wrong?token=' + token)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('GET with an incorrect path should respond 404, response should be HTML for UI', (done) => {
      request(httpServer)
        .get('/get-wrong?token=' + token)
        .expect('Content-Type', /html/)
        .expect(404, done);
    });
  });

  it('POST with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .post('/api/post-request?token=' + token)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ok: 1}, done);
  });

  it('POST with a JSON body', (done) => {
    const postData = {fake: 'message'};

    request(httpServer)
      .post('/api/post-with-body?token=' + token)
      .send(postData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({body: postData}, done);
  });

  it('POST with an incorrect token should respond 403', (done) => {
    request(httpServer)
      .post('/api/post-request?token=wrong')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('PUT with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .put('/api/put-request?token=' + token)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ok: 1}, done);
  });

  it('PATCH with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .patch('/api/patch-request?token=' + token)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ok: 1}, done);
  });

  it('DELETE with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .delete('/api/delete-request?token=' + token)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ok: 1}, done);
  });
});

describe('HTTP server', () => {
  after(() => {
    httpServer.close();
  });

  it('Add and verify custom static path', (done) => {
    httpServer.addStaticPath(path.join(__dirname, 'mocha-http.js'), 'mocha-http');
    request(httpServer)
      .get('/mocha-http')
      .expect(200, done);
  });

  it('Add custom static path that does not exist', (done) => {
    try {
      httpServer.addStaticPath(path.join(__dirname, 'does-not-exist'), 'does-not-exist');
    } catch (error) {
      done();
    }
  });
});
