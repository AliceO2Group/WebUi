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

import * as grpc from '@grpc/grpc-js';

// Capture service impl registered on grpc.Server.addService
let capturedServerImpl: any | null = null;

jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn(() => ({})),
}));

const CentralSystemClientMock = jest.fn();
const Peer2PeerCtorMock = jest.fn();

// Mock @grpc/grpc-js
jest.mock('@grpc/grpc-js', () => {
  const original = jest.requireActual('@grpc/grpc-js');

  const mockServer = {
    addService: jest.fn((_svc: any, impl: any) => {
      capturedServerImpl = impl;
    }),
    bindAsync: jest.fn((_addr: string, _creds: any, cb: any) => cb(null)),
    forceShutdown: jest.fn(),
  };
  const ServerCtor = jest.fn(() => mockServer);

  const loadPackageDefinition = jest.fn(() => ({
    webui: {
      tokenization: {
        CentralSystem: CentralSystemClientMock,
        Peer2Peer: Object.assign(Peer2PeerCtorMock, {
          service: {
            Fetch: {
              path: '/webui.tokenization.Peer2Peer/Fetch',
              requestStream: false,
              responseStream: false,
              requestSerialize: (x: any) => x,
              requestDeserialize: (x: any) => x,
              responseSerialize: (x: any) => x,
              responseDeserialize: (x: any) => x,
            },
          },
        }),
      },
    },
  }));

  return {
    ...original,
    loadPackageDefinition,
    credentials: {
      createSsl: jest.fn(() => ({})),
    },
    ServerCredentials: {
      createSsl: jest.fn(() => ({})),
    },
    status: {
      ...original.status,
      INTERNAL: 13,
    },
    Server: ServerCtor,
  };
});

// Mock CentralCommandDispatcher
const dispatcherRegisterMock = jest.fn();
jest.mock(
  '../../../client/connectionManager/eventManagement/CentralCommandDispatcher',
  () => ({
    CentralCommandDispatcher: jest.fn().mockImplementation(() => ({
      register: dispatcherRegisterMock,
    })),
  }),
  { virtual: true }
);

// Mock CentralConnection
const centralStartMock = jest.fn();
const centralDisconnectMock = jest.fn();
jest.mock(
  '../../../client/connectionManager/CentralConnection',
  () => ({
    CentralConnection: jest.fn().mockImplementation(() => ({
      start: centralStartMock,
      disconnect: centralDisconnectMock,
    })),
  }),
  { virtual: true }
);

// Track Connection instances and allow status changes
const createdConnections: any[] = [];
const connectionCtorMock = jest.fn().mockImplementation(function (this: any, token: string, address: string, direction: any, peerCtor: any) {
  this._token = token;
  this._address = address;
  this.direction = direction;
  this.status = undefined;
  this.targetAddress = address;
  this.token = token;
  Object.defineProperty(this, 'status', {
    get: () => this._status,
    set: (v) => (this._status = v),
    configurable: true,
  });
  createdConnections.push({ token, address, direction, peerCtor, instance: this });
});
jest.mock(
  '../../../client/connection/Connection',
  () => ({
    Connection: connectionCtorMock,
  }),
  { virtual: true }
);

const infoMessageMock = jest.fn();
const errorMessageMock = jest.fn();
jest.mock(
  '@aliceo2/web-ui',
  () => ({
    LogManager: {
      getLogger: () => ({
        infoMessage: infoMessageMock,
        errorMessage: errorMessageMock,
        debugMessage: jest.fn(),
      }),
    },
  }),
  { virtual: true }
);

import { ConnectionManager } from '../../../client/ConnectionManager/ConnectionManager';
import { ConnectionDirection } from '../../../models/message.model';
import { ConnectionStatus } from '../../../models/connection.model';
import { getTestCentralCertPaths, getTestCerts } from '../../../test/testCerts/testCerts';

describe('ConnectionManager', () => {
  const { caCertPath, certPath, keyPath } = getTestCentralCertPaths();

  beforeEach(() => {
    jest.clearAllMocks();
    capturedServerImpl = null;
    createdConnections.length = 0;
    // @ts-ignore
    global.fetch = jest.fn();
  });

  afterAll(() => {
    // @ts-ignore
    delete global.fetch;
  });

  test('constructor: loads proto, builds wrapper/peerCtor and CentralSystem client', () => {
    const cm = new ConnectionManager('proto/file.proto', 'central:5555', caCertPath, certPath, keyPath);
    expect(cm).toBeDefined();

    expect((grpc as any).loadPackageDefinition).toHaveBeenCalled();
    expect(CentralSystemClientMock).toHaveBeenCalledWith('central:5555', expect.any(Object));
    expect(grpc.credentials.createInsecure).toHaveBeenCalled();
  });

  test('registerCommandHandlers: calls dispatcher.register for each item', () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    dispatcherRegisterMock.mockClear();

    const handlers = [
      { event: 1 as any, handler: { handle: jest.fn() } as any },
      { event: 2 as any, handler: { handle: jest.fn() } as any },
    ];

    cm.registerCommandHandlers(handlers);

    expect(dispatcherRegisterMock).toHaveBeenCalledTimes(2);
    expect(dispatcherRegisterMock).toHaveBeenCalledWith(handlers[0].event, handlers[0].handler);
    expect(dispatcherRegisterMock).toHaveBeenCalledWith(handlers[1].event, handlers[1].handler);
  });

  test('connectToCentralSystem/disconnectFromCentralSystem delegate to CentralConnection', () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    // @ts-ignore
    cm['_peerCtor'] = Peer2PeerCtorMock;
    cm.connectToCentralSystem();
    expect(centralStartMock).toHaveBeenCalled();

    cm.disconnectFromCentralSystem();
    expect(centralDisconnectMock).toHaveBeenCalled();
  });

  test('createNewConnection: adds to sending map, sets CONNECTED, logs', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    // @ts-ignore
    cm['_peerCtor'] = Peer2PeerCtorMock;
    const conn = await cm.createNewConnection('peer-A', ConnectionDirection.SENDING, 'tok123');

    expect(connectionCtorMock).toHaveBeenCalledWith('tok123', 'peer-A', ConnectionDirection.SENDING, expect.any(Function));
    expect(conn.status).toBe(ConnectionStatus.CONNECTED);

    // Exposed via connections getter
    const { sending, receiving } = cm.connections;
    expect(sending.length).toBe(1);
    expect(receiving.length).toBe(0);

    expect(infoMessageMock).toHaveBeenCalledWith(expect.stringContaining('Connection with peer-A has been estabilished'));
  });

  test('createNewConnection: adds to receiving map if direction is RECEIVING', () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    cm.createNewConnection('peer-B', ConnectionDirection.RECEIVING);

    const { sending, receiving } = cm.connections;
    expect(sending.length).toBe(0);
    expect(receiving.length).toBe(1);
  });

  test('getConnectionByAddress: returns by direction. Logs on invalid direction', () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    const s = cm.createNewConnection('s-1', ConnectionDirection.SENDING);
    const r = cm.createNewConnection('r-1', ConnectionDirection.RECEIVING);

    expect(cm.getConnectionByAddress('s-1', ConnectionDirection.SENDING)).toBe(s);
    expect(cm.getConnectionByAddress('r-1', ConnectionDirection.RECEIVING)).toBe(r);

    errorMessageMock.mockClear();
    const invalid = cm.getConnectionByAddress('x', 999 as any);
    expect(invalid).toBeUndefined();
    expect(errorMessageMock).toHaveBeenCalledWith('Invalid connection direction: 999');
  });

  test('connections getter: returns arrays (copies) of maps', () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    cm.createNewConnection('a', ConnectionDirection.SENDING);
    cm.createNewConnection('b', ConnectionDirection.RECEIVING);

    const { sending, receiving } = cm.connections;
    expect(Array.isArray(sending)).toBe(true);
    expect(Array.isArray(receiving)).toBe(true);
    expect(sending.length).toBe(1);
    expect(receiving.length).toBe(1);
  });

  test('listenForPeers: creates server, registers service, binds & logs', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    await cm.listenForPeers(50099, getTestCerts().clientKey, getTestCerts().clientCert, 'http://localhost:41000/api/');

    const ServerCtor = (grpc.Server as any).mock;
    expect(ServerCtor).toBeDefined();
    expect(ServerCtor.calls.length).toBeGreaterThan(0);

    const serverInstance = ServerCtor.results[0].value;
    expect(serverInstance.addService).toHaveBeenCalled();
    expect(serverInstance.bindAsync).toHaveBeenCalledWith('localhost:50099', expect.anything(), expect.any(Function));
    expect(infoMessageMock).toHaveBeenCalledWith('Peer server listening on localhost:50099');

    // Service impl captured
    expect(capturedServerImpl).toBeTruthy();
    expect(typeof capturedServerImpl.Fetch).toBe('function');
  });

  test('listenForPeers: calling twice shuts previous server down', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    await cm.listenForPeers(50100, getTestCerts().clientKey, getTestCerts().clientCert, 'http://localhost:41000/api/');
    const firstServer = (grpc.Server as any).mock.results[0].value;

    await cm.listenForPeers(50101, getTestCerts().clientKey, getTestCerts().clientCert, 'http://localhost:41000/api/');
    expect(firstServer.forceShutdown).toHaveBeenCalled();
  });

  test('p2p Fetch: registers new incoming receiving connection, forwards to local API, maps response', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    await cm.listenForPeers(50102, getTestCerts().clientKey, getTestCerts().clientCert, 'http://local/api/');

    // Prepare incoming call and callback
    const call = {
      getPeer: () => 'client-42',
      request: {
        method: 'post',
        path: 'echo',
        headers: { 'content-type': 'application/json' },
        body: Buffer.from(JSON.stringify({ ping: true })),
      },
    } as any;
    const callback = jest.fn();

    // Mock fetch response
    // @ts-ignore
    global.fetch.mockResolvedValue({
      status: 202,
      headers: {
        forEach: (fn: (v: string, k: string) => void) => {
          fn('application/json', 'content-type');
          fn('abc', 'x-extra');
        },
      },
      arrayBuffer: async () => Buffer.from(JSON.stringify({ ok: 1 })),
    });

    const before = cm.connections.receiving.length;
    await capturedServerImpl.Fetch(call, callback);

    expect(global.fetch).toHaveBeenCalledWith('http://local/api/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });

    // Response mapped back to gRPC
    expect(callback).toHaveBeenCalledWith(null, {
      status: 202,
      headers: { 'content-type': 'application/json', 'x-extra': 'abc' },
      body: expect.any(Buffer),
    });

    // Receiving connection was created & stored
    const after = cm.connections.receiving.length;
    expect(after).toBeGreaterThan(before);

    const found = cm.getConnectionByAddress('client-42', ConnectionDirection.RECEIVING);
    expect(found).toBeDefined();
    expect(infoMessageMock).toHaveBeenCalledWith(expect.stringContaining('Incoming request from client-42'));
    expect(infoMessageMock).toHaveBeenCalledWith(expect.stringContaining('New incoming connection registered for: client-42'));
  });

  test('p2p Fetch: uses existing receiving connection when present (no duplicate creation)', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    await cm.listenForPeers(50103, getTestCerts().clientKey, getTestCerts().clientCert, 'http://local/api/');

    cm.createNewConnection('client-77', ConnectionDirection.RECEIVING);

    // @ts-ignore
    global.fetch.mockResolvedValue({
      status: 200,
      headers: { forEach: (fn: any) => fn('text/plain', 'content-type') },
      arrayBuffer: async () => Buffer.from('ok'),
    });

    const call = {
      getPeer: () => 'client-77',
      request: { method: 'get', path: 'pong', headers: {}, body: undefined },
    } as any;

    const callback = jest.fn();

    const before = cm.connections.receiving.length;
    await capturedServerImpl.Fetch(call, callback);

    // No new receiving connection added
    const after = cm.connections.receiving.length;
    expect(after).toBe(before);

    // Forwarded with GET and no body
    expect(global.fetch).toHaveBeenCalledWith('http://local/api/pong', {
      method: 'GET',
      headers: {},
      body: undefined,
    });

    expect(callback).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        status: 200,
        headers: { 'content-type': 'text/plain' },
        body: expect.any(Buffer),
      })
    );
  });

  test('p2p Fetch: on forward error returns INTERNAL and logs error', async () => {
    const cm = new ConnectionManager('p.proto', 'c:1', caCertPath, certPath, keyPath);
    await cm.listenForPeers(50104, getTestCerts().clientKey, getTestCerts().clientCert, 'http://local/api/');

    // @ts-ignore
    global.fetch.mockRejectedValue(new Error('err'));

    const call = {
      getPeer: () => 'err-client',
      request: { method: 'get', path: 'fail', headers: {} },
    } as any;
    const callback = jest.fn();

    await capturedServerImpl.Fetch(call, callback);

    expect(errorMessageMock).toHaveBeenCalledWith(expect.stringContaining('Error forwarding request'));
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        code: grpc.status.INTERNAL,
        message: 'err',
      })
    );
  });
});
