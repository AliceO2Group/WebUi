const assert = require('assert');
const config = require('./../config.json');
const JwtToken = require('./../jwt/token.js');
const chai = require('chai');
const expect = chai.expect;
const chaiHttp = require('chai-http');
const WebSocketClient = require('ws');
const WebSocket = require('./../websocket/server');
const HttpServer = require('./../http/server');

// as CERN cerfiticates are not signed by any CA
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
chai.use(chaiHttp);

const http = new HttpServer(config.http, config.jwt, config.oAuth);
new WebSocket(http, config.jwt, 'test.cern.ch');
const jwt = new JwtToken(config.jwt);
const token = jwt.generateToken(0, 'test', 1);

describe('rest-api', () => {
  it('should fail as no token provided', (done) => {
    chai.request(http.httpsServer).get('/api/runs').end((err, res) => {
      assert.equal(res.status, 403, 'Wrong HTTP response code');
      done();
    });
  });

  it('should get response', (done) => {
    chai.request(http.httpsServer)
      .get('/api/runs')
      .query({token: token})
      .end((err, res) => {
        assert.equal(res.status, 200, 'Wrong HTTP response code');
        done();
      });
  });
});

describe('websocket', () => {
  it('connection should be dropped due to invalid oAuth token', (done) => {
    const connection = new WebSocketClient(
      'wss://localhost:' + config.http.portSecure +'/?oauth=' + token
    );

    connection.on('close', () => {
      done();
    });
  });
});

describe('save-subscription', () => {
  it('should throw error because save request does not have endpoint', () => {
    chai.request(http.httpsServer)
      .post('/api/save-subscription')
      .query({token: token})
      .send({
        key: 'hello'
      })
      .end((err, res) => {
        assert.equal(res.body.error.message, 'Subscription must have an endpoint.');
      });
  });

  it('should save subscription', () => {
    chai.request(http.httpsServer)
      .post('/api/save-subscription')
      .query({token: token})
      .send({
        endpoint: 'hello',
        keys: {
          auth: 'test',
          p256dh: 'test'
        }
      })
      .end((err, res) => {
        assert.equal(res.body.data.success, true);
      });
  });
});

describe('update-preferences', () => {
  // it('should throw error because save request is invalid', (done) => {
  //   chai.request(http.httpsServer)
  //   .post('/api/update-preferences')
  //   .query({token: token})
  //   .send({
  //     endpoint: undefined,
  //     preferences: undefined
  //   })
  //   .end((err, res) => {
  //     assert.equal(err, true);
  //   });
  // });

  it('should update preferences', () => {
    chai.request(http.httpsServer)
      .post('/api/update-preferences')
      .query({token: token})
      .send({
        endpoint: 'hello',
        preferences: '111'
      })
      .end((err, res) => {
        assert.equal(res.body.data.success, true);
      });
  });
});

describe('get-preferences', () => {
  // it('should throw error because save request is invalid', () => {
  //   chai.request(http.httpsServer)
  //     .post('/api/get-preferences')
  //     .query({token: token})
  //     .send({ key: 'hello'})
  //     .end((err, res) => {
  //       assert.equal(res.body.error.message, 'Subscription must have an endpoint.');
  //   });
  // });

  it('should get preferences', () => {
    chai.request(http.httpsServer)
      .post('/api/get-preferences')
      .query({token: token})
      .send({
        endpoint: 'hello'
      })
      .end((err, res) => {
        expect(res.body).to.be.an('array');
      });
  });
});

describe('delete-subscription', () => {
  // it('should throw error because save request is invalid', () => {
  //   chai.request(http.httpsServer)
  //     .post('/api/save-subscription')
  //     .query({token: token})
  //     .send({ key: 'hello'})
  //     .end((err, res) => {
  //       assert.equal(res.body.error.message, 'Subscription must have an endpoint.');
  //   });
  // });

  it('should delete subscription', () => {
    chai.request(http.httpsServer)
      .post('/api/delete-subscription')
      .query({token: token})
      .send({
        endpoint: 'hello'
      })
      .end((err, res) => {
        assert.equal(res.body.data.success, true);
      });
  });
});
