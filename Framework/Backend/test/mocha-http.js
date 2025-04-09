/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunities
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const assert = require('assert');
const path = require('path');
const url = require('url');
const config = require('./../config-default.json');
const O2TokenService = require('./../services/O2TokenService.js');
const HttpServer = require('./../http/server');
const { parseUrlParameters } = require('../http/parseUrlParameters.js');
const { buildUrl } = require('../http/buildUrl.js');

// As CERN certificates are not signed by any CA
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let httpServer;
const tokenService = new O2TokenService(config.jwt);
const USER = {
  personid: 0,
  username: 'test',
  name: 'Test',
  access: 'admin',
};
const token = tokenService.generateToken(0, 'test', 'Test', 'admin');

describe('REST API', () => {
  before(() => {
    httpServer = new HttpServer(config.http, config.jwt);
    httpServer.get('/get-insecure', (req, res) => res.json({ ok: 1 }), { public: true });
    httpServer.get('/get-authenticated-insecure', (req, res) => res.json({ session: req.session }), { public: true });
    httpServer.get('/get-request', (req, res) => res.json({ ok: 1 }));
    httpServer.get('/get-error', (req, res, next) => next(new Error('Some unexpected error')));
    httpServer.get('/get-crash', () => {
      throw new Error('Some unexpected error');
    });
    httpServer.post('/post-request', (req, res) => res.json({ ok: 1 }));
    httpServer.post('/post-with-body', (req, res) => res.json({ body: req.body }));
    httpServer.put('/put-request', (req, res) => res.json({ ok: 1 }));
    httpServer.patch('/patch-request', (req, res) => res.json({ ok: 1 }));
    httpServer.delete('/delete-request', (req, res) => res.json({ ok: 1 }));

    httpServer.get(
      '/get-middleware',
      (req, res, next) => isNaN(req.query.id) ? next(new Error('Not Allowed')) : next(),
      (req, res) => res.json({ ok: 1 }),
    );
  });

  it('Verify that mithril is present', (done) => {
    request(httpServer)
      .get('/mithril/mithril.min.js')
      .expect(200)
      .end((err) => {
        done(err);
      });
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

  it('GET without token should respond 200/JSON', (done) => {
    request(httpServer)
      .get('/api/get-insecure')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
  });

  it('Crashing route should respond 500/JSON', (done) => {
    request(httpServer)
      .get(`/api/get-crash?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(500)
      .expect({
        error: '500 - Server error',
        message: 'Something went wrong, please try again or contact an administrator.',
      }, done);
  });

  it('Error route should respond 500/JSON', (done) => {
    request(httpServer)
      .get(`/api/get-error?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(500)
      .expect({
        error: '500 - Server error',
        message: 'Something went wrong, please try again or contact an administrator.',
      }, done);
  });

  it('GET with token should respond 200/JSON', (done) => {
    request(httpServer)
      .get(`/api/get-request?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
  });

  it('GET public with a token should authenticate user', (done) => {
    request(httpServer)
      .get(`/api/get-authenticated-insecure?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ session: USER }, done);
  });

  it('GET with an incorrect token should respond 403', (done) => {
    request(httpServer)
      .get('/api/get-request?token=wrong')
      .expect('Content-Type', /json/)
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'Invalid JWT token provided',
      }, done);
  });

  it('GET without a token should respond 403', (done) => {
    request(httpServer)
      .get('/api/get-request')
      .expect('Content-Type', /json/)
      .expect(403, {
        error: '403 - Json Web Token Error',
        message: 'You must provide a JWT token',
      }, done);
  });

  it('GET with an incorrect path should respond 404', (done) => {
    request(httpServer)
      .get(`/api/get-wrong?token=${token}`)
      .expect(404, done);
  });

  describe('Middleware handler', () => {
    it('should return ok if the middleware satisfied the query condition', (done) => {
      request(httpServer)
        .get(`/api/get-middleware?id=1&token=${token}`)
        .expect('Content-Type', /json/)
        .expect(200)
        .expect({ ok: 1 }, done);
    });

    it('should return error 500 if the middleware dissatisfied the query condition', (done) => {
      request(httpServer)
        .get(`/api/get-middleware?id=false&token=${token}`)
        .expect('Content-Type', /json/)
        .expect(500, done);
    });
  });

  describe('404 handler', () => {
    it('GET with an incorrect path should respond 404, response should be JSON for API', (done) => {
      request(httpServer)
        .get(`/api/get-wrong?token=${token}`)
        .expect('Content-Type', /json/)
        .expect(404, done);
    });

    it('GET with an incorrect path should respond 404, response should be HTML for UI', (done) => {
      request(httpServer)
        .get(`/get-wrong?token=${token}`)
        .expect('Content-Type', /html/)
        .expect(404, done);
    });

    it('should successfully remove the token from the URL', () => {
      const req = {
        query: { token: 'fdsaf234fsdfa.fsd' },
        originalUrl: '/api/some?query=something&token=fdsaf234fsdfa.fsd',
      };
      assert.strictEqual(httpServer._parseOriginalUrl(req), '/api/some?query=something&');
    });

    it('should successfully return the original URL if replacing throwed an error', () => {
      const req = {
        originalUrl: '/api/some?query=something&token=fdsaf234fsdfa.fsd',
      };
      assert.strictEqual(httpServer._parseOriginalUrl(req), '/api/some?query=something&token=fdsaf234fsdfa.fsd');
    });
  });

  it('POST with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .post(`/api/post-request?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
  });

  it('POST with a JSON body', (done) => {
    const postData = { fake: 'message' };

    request(httpServer)
      .post(`/api/post-with-body?token=${token}`)
      .send(postData)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ body: postData }, done);
  });

  it('POST with an incorrect token should respond 403', (done) => {
    request(httpServer)
      .post('/api/post-request?token=wrong')
      .expect('Content-Type', /json/)
      .expect(403, done);
  });

  it('PUT with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .put(`/api/put-request?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
  });

  it('PATCH with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .patch(`/api/patch-request?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
  });

  it('DELETE with a token should respond 200/JSON', (done) => {
    request(httpServer)
      .delete(`/api/delete-request?token=${token}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .expect({ ok: 1 }, done);
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
    } catch {
      done();
    }
  });
});

describe('HTTP constructor checks', () => {
  let httpServer;
  afterEach(async () => {
    await httpServer.close();
  });
  it('should succesfully add default limit for request body size to 100kb', async () => {
    httpServer = new HttpServer(config.http, config.jwt);
    assert.strictEqual(httpServer.limit, '100kb', 'Default limit was not set');
  });
  it('should succesfully add provided limit from configuration for request body size', async () => {
    const conf = config.http;
    conf.limit = '10Mb';
    httpServer = new HttpServer(conf, config.jwt);
    assert.strictEqual(httpServer.limit, '10Mb', 'Provided limit was not set');
  });
});

describe('URL parameters extraction checks', () => {
  it('should successfully extract single parameters', () => {
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param=12')), { param: '12' });
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param=random-param')), { param: 'random-param' });
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param=')), { param: '' });
  });
  it('should successfully extract object parameters', () => {
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param[prop1]=12')), { param: { prop1: '12' } });
    assert.deepEqual(
      parseUrlParameters(new URLSearchParams('param[prop1]=first&param[prop2]=second&param[prop3]=348')),
      { param: { prop1: 'first', prop2: 'second', prop3: '348' } },
    );
  });

  it('should successfully extract array parameters', () => {
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param[]=12&param[]=83')), { param: ['12', '83'] });
    assert.deepEqual(parseUrlParameters(new URLSearchParams('param[]=first&param[]=second')), { param: ['first', 'second'] });
  });

  it('should successfully extract complex nested parameters', () => {
    assert.deepEqual(
      parseUrlParameters(new URLSearchParams('param[prop1][]=29&param[prop2][]=92')),
      { param: { prop1: ['29'], prop2: ['92'] } },
    );
  });

  it('should successfully combine parameter within an existing parameter tree', () => {
    assert.deepEqual(
      parseUrlParameters(new URLSearchParams('param=12'), { existing: '45' }),
      { existing: '45', param: '12' },
    );

    assert.deepEqual(
      parseUrlParameters(new URLSearchParams('prop1[]=12&prop2[]=hello'), { existing: ['45'], prop1: ['93'] }),
      { existing: ['45'], prop1: ['93', '12'], prop2: ['hello'] },
    );

    assert.deepEqual(
      parseUrlParameters(new URLSearchParams('param[prop1]=value&param[prop2]=48'), {
        existing: { nested: '73' },
        param: { prop1: 'other' },
      }),
      { existing: { nested: '73' }, param: { prop1: 'value', prop2: '48' } },
    );
  });

  it('should throw when combining parameters with incoherent values', () => {
    assert.throws(
      () => parseUrlParameters(new URLSearchParams('key=12'), { key: ['1', '3'] }),
      new Error('Node in parameters tree is an array but no more nested keys - key'),
    );

    assert.throws(
      () => parseUrlParameters(new URLSearchParams('key[]=12'), { key: 'value' }),
      new Error('Expected node in parameters tree to be an array - key[]'),
    );

    assert.throws(
      () => parseUrlParameters(new URLSearchParams('key=12'), { key: { nested: '1' } }),
      new Error('Node in parameters tree is an object but no more nested keys - key'),
    );

    assert.throws(
      () => parseUrlParameters(new URLSearchParams('key[nested]=12'), { key: 'value' }),
      new Error('Expected node in parameters tree to be an object - key[nested]'),
    );
  });

  it('should protect against prototype polluting assignment', () => {
    assert.throws(
      () => parseUrlParameters(new URLSearchParams('__proto__="{wrong: 12}"'), {}),
      new Error('Unauthorized parameters key __proto__'),
    );
    assert.throws(
      () => parseUrlParameters(new URLSearchParams('constructor=12'), {}),
      new Error('Unauthorized parameters key constructor'),
    );
    assert.throws(
      () => parseUrlParameters(new URLSearchParams('prototype=fake-prototype'), {}),
      new Error('Unauthorized parameters key prototype'),
    );
  });
});

describe('URL building checks', () => {
  it('should successfully build URL using only parameters object', () => {
    const url = buildUrl('https://example.com', {
      simple: 'hello',
      '%': '%',
      key: {
        nested: [1, 2],
        '=': 12,
      },
    });

    assert.match(url, /simple=hello/);
    assert.match(url, /%25=%25/);
    assert.match(url, /key\[nested]\[]=1/);
    assert.match(url, /key\[nested]\[]=2/);
    assert.match(url, /key\[%3D]=12/);
  });

  it('should successfully build URL with an empty parameters list', () => {
    const url = buildUrl('https://example.com', { filter: {} });
    assert.equal('https://example.com', url);
  });

  it('should successfully build URL by combining existing parameters', () => {
    const url = buildUrl('https://example.com?simple=hello&%25=%25&key1[key2][]=13&key1[key2][]=35', {
      key1: {
        key2: [1, 2],
      },
      key3: null,
    });

    assert.match(url, /simple=hello/);
    assert.match(url, /%25=%25/);
    assert.match(url, /key1\[key2]\[]=13/);
    assert.match(url, /key1\[key2]\[]=35/);
    assert.match(url, /key1\[key2]\[]=1/);
    assert.match(url, /key1\[key2]\[]=2/);
    assert.match(url, /key3=null/);
  });

  it('should throw an error when trying to push value to not array parameter', () => {
    assert.throws(
      () => buildUrl(
        'https://example.com?key=12',
        {
          key: [1, 3],
        },
      ),
      new Error('Node in parameters tree is an array but no more nested keys - key'),
    );

    assert.throws(
      () => buildUrl(
        'https://example.com?key[nested]=12',
        {
          key: [1, 3],
        },
      ),
      new Error('Expected node in parameters tree to be an object - key[nested]'),
    );
  });

  it('should throw an error when trying to set nested value of a not nested parameter', () => {
    assert.throws(
      () => buildUrl(
        'https://example.com?key=12',
        {
          key: { nested: 13 },
        },
      ),
      new Error('Node in parameters tree is an object but no more nested keys - key'),
    );

    assert.throws(
      () => buildUrl(
        'https://example.com?key[]=12',
        {
          key: { nested: 13 },
        },
      ),
      new Error('Expected node in parameters tree to be an array - key[]'),
    );
  });

  it('should throw an error when trying to set value for array parameter', () => {
    assert.throws(
      () => buildUrl(
        'https://example.com?key[]=12',
        {
          key: 1,
        },
      ),
      new Error('Expected node in parameters tree to be an array - key[]'),
    );
  });

  it('should throw an error when trying to set value for nested parameter', () => {
    assert.throws(
      () => buildUrl(
        'https://example.com?key[nested]=12',
        {
          key: 1,
        },
      ),
      new Error('Expected node in parameters tree to be an object - key[nested]'),
    );
  });
});
