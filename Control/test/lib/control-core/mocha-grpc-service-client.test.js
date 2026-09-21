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

const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const { InvalidInputError } = require('@aliceo2/web-ui');

describe(`'GrpcServiceClient' test suite`, () => {
  const TEST_PROTO_PATH = '/path/to/test.proto';
  const config = Object.freeze({
    hostname: 'localhost',
    port: 32101,
    label: 'TestService',
    package: 'testPackage',
    timeout: 30000,
    connectionTimeout: 10000,
    maxMessageLength: 50,
  });

  let GrpcServiceClient;
  let grpcServiceClient;
  let grpcLibraryMock;

  beforeEach(() => {
    grpcLibraryMock = {
      credentials: {
        createInsecure: sinon.stub().returns({}),
      },
      loadPackageDefinition: sinon.stub().returns({
        testPackage: {
          TestService: sinon.stub().callsFake(() => ({
            getChannel: sinon.stub().returns({
              getConnectivityState: sinon.stub().returns('READY'),
              watchConnectivityState: sinon.stub(),
            }),
            waitForReady: sinon.stub(),
          })),
        },
      }),
      connectivityState: {
        READY: 'READY',
        IDLE: 'IDLE',
        CONNECTING: 'CONNECTING',
        TRANSIENT_FAILURE: 'TRANSIENT_FAILURE',
        SHUTDOWN: 'SHUTDOWN',
      },
    };
    const protoLoaderStub = {
      loadSync: sinon.stub().returns({})
    };

    GrpcServiceClient = proxyquire('./../../../lib/control-core/GrpcServiceClient.js', {
      '@grpc/grpc-js': grpcLibraryMock,
      '@grpc/proto-loader': protoLoaderStub,
    });

    grpcServiceClient = new GrpcServiceClient(config, TEST_PROTO_PATH);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Create new GrpcServiceClient test suite', () => {
    it('should have successfully initialize in before statement the GrpcServiceClient with the correct configuration', () => {
      assert.ok(grpcServiceClient.client);
      assert.strictEqual(grpcServiceClient._label, 'TestService');
      assert.strictEqual(grpcServiceClient._package, 'testPackage');
    });

    it('should mark the connection as false if configuration is invalid', () => {
      const invalidConfig = { ...config, hostname: null };
      const clientWithInvalidConfig = new GrpcServiceClient(invalidConfig, TEST_PROTO_PATH);
      assert.strictEqual(clientWithInvalidConfig.isConnectionReady, false);
      assert.deepStrictEqual(clientWithInvalidConfig.connectionError, new InvalidInputError('Invalid configuration for gRPC client'));
    });
  });

  describe('`_initializeMethods && _getAndSetPromisifiedMethod` - test suite', () => {
    it('should filter out and only bind and promisify expected gRPC methods', () => {
      const protoService = {
        prototype: {
          TestMethod: () => { },
          testMethod: () => { },
          $privateMethod: () => {},
        },
      };

      grpcServiceClient._initializeMethods(protoService);

      assert.strictEqual(typeof grpcServiceClient.TestMethod, 'function');
      assert.strictEqual(grpcServiceClient.$privateMethod, undefined);
      assert.strictEqual(grpcServiceClient.testMethod, undefined);
    });
  });

  describe(`'_establishConnectionWithRetry' - test suite`, () => {
    it('should attempt to connect and handle success', (done) => {
      grpcServiceClient.client.waitForReady = sinon.stub()
        .callsFake((_, callback) => {
          callback(null); // Simulate successful connection
        }
      );

      const handleConnectionStatusStub = sinon.stub(grpcServiceClient, '_handleConnectionStatus');
      const monitorChannelStub = sinon.stub(grpcServiceClient, '_monitorChannelStateAndReconnect');

      grpcServiceClient._establishConnectionWithRetry('localhost:32101');

      setTimeout(() => {
        sinon.assert.calledOnce(grpcServiceClient.client.waitForReady);
        sinon.assert.calledWith(handleConnectionStatusStub, null, 'localhost:32101');
        sinon.assert.calledOnce(monitorChannelStub);
        done();
      }, 100);
    });

    it('should successfully retry to reconnect on failure', (done) => {
      const waitForReadyStub = grpcServiceClient.client.waitForReady.callsFake((deadline, callback) => {
        callback(new Error('Connection failed'));
      });

      const handleConnectionStatusStub = sinon.stub(grpcServiceClient, '_handleConnectionStatus');
      grpcServiceClient._establishConnectionWithRetry('localhost:32101');

      setTimeout(() => {
        sinon.assert.calledTwice(waitForReadyStub);
        sinon.assert.calledWith(handleConnectionStatusStub, sinon.match.instanceOf(Error), 'localhost:32101');
        done();
      }, 100);
    });
  });

  describe('_monitorChannelStateAndReconnect', () => {
    it('should monitor channel state and reconnect if necessary', (done) => {
      grpcServiceClient.client.getChannel = sinon.stub().returns({
        getConnectivityState: sinon.stub().returns(grpcLibraryMock.connectivityState.TRANSIENT_FAILURE),
        getTarget: sinon.stub().returns('localhost:32101'),
      });
      const establishConnectionStub = sinon.stub(grpcServiceClient, '_establishConnectionWithRetry');
      grpcServiceClient._monitorChannelStateAndReconnect();

      setTimeout(() => {
        sinon.assert.calledOnce(establishConnectionStub);
        done();
      }, 100);
    });

    it('should not reconnect if channel state is READY/IDLE/CONNECTING', (done) => {
      const channelStub = {
        getConnectivityState: sinon.stub().returns(grpcLibraryMock.connectivityState.READY),
        watchConnectivityState: sinon.stub(),
      };

      grpcServiceClient.client.getChannel = sinon.stub().returns(channelStub);
      const establishConnectionStub = sinon.stub();
      grpcServiceClient._establishConnectionWithRetry = establishConnectionStub;
      grpcServiceClient._monitorChannelStateAndReconnect();

      setTimeout(() => {
        sinon.assert.notCalled(establishConnectionStub);
        done();
      }, 10);
    });
  });

  describe('_handleConnectionStatus', () => {
    it('should update connection status on success', () => {
      grpcServiceClient._handleConnectionStatus(null, 'localhost:32101');
      assert.strictEqual(grpcServiceClient.isConnectionReady, true);
      assert.strictEqual(grpcServiceClient.connectionError, null);
    });

    it('should update connection status on failure', () => {
      const error = new Error('Connection failed');
      grpcServiceClient._handleConnectionStatus(error, 'localhost:32101');
      assert.strictEqual(grpcServiceClient.isConnectionReady, false);
      assert.strictEqual(grpcServiceClient.connectionError, error);
    });
  });
});
