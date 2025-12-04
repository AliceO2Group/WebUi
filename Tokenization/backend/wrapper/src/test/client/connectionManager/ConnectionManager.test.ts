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
import { ConnectionManager } from '../../../client/connectionManager/ConnectionManager';
import { ConnectionDirection, DuplexMessageEvent } from '../../../models/message.model';
import { SecurityContext } from '../../../utils/security/SecurityContext';

// Mock duplex stream
const mockStream = {
  on: jest.fn(),
  end: jest.fn(),
};

// Mock gRPC client
const mockClient = {
  ClientStream: jest.fn(() => mockStream),
};

// Mock CentralSystem constructor
const CentralSystemMock = jest.fn(() => mockClient);

// Mock gRPC auth interceptor
jest.mock('../../../client/connectionManager/interceptors/grpc.auth.interceptor', () => ({
  gRPCAuthInterceptor: jest.fn((call, callback) => {
    return Promise.resolve({
      isAuthenticated: true,
      conn: {
        updateStatus: jest.fn(),
        handleSuccessfulAuth: jest.fn(),
        getSerialNumber: jest.fn(),
        setSerialNumber: jest.fn(),
      },
    });
  }),
}));

// Mock dispatcher
const mockDispatch = jest.fn();
jest.mock('../../../client/connectionManager/eventManagement/CentralCommandDispatcher', () => ({
  CentralCommandDispatcher: jest.fn(() => ({
    dispatch: mockDispatch,
    register: jest.fn(),
  })),
}));

// Mock logger
jest.mock(
  '@aliceo2/web-ui',
  () => ({
    LogManager: {
      getLogger: () => ({
        infoMessage: jest.fn(),
        debugMessage: jest.fn(),
        errorMessage: jest.fn(),
      }),
    },
  }),
  { virtual: true }
);

// Mock gRPC proto loader and client
jest.mock('@grpc/proto-loader', () => ({
  loadSync: jest.fn(() => {
    return {};
  }),
}));

let capturedServerImpl: any | null = null;

jest.mock('@grpc/grpc-js', () => {
  const original = jest.requireActual('@grpc/grpc-js');
  const Peer2PeerMock: any = jest.fn(() => ({
    Fetch: jest.fn(),
  }));
  // simulation of the service definition
  Peer2PeerMock.service = {
    Fetch: {
      path: '/webui.tokenization.Peer2Peer/Fetch',
      requestStream: false,
      responseStream: false,
      requestSerialize: (x: any) => x,
      requestDeserialize: (x: any) => x,
      responseSerialize: (x: any) => x,
      responseDeserialize: (x: any) => x,
    },
  };

  // Mock server
  const mockServer = {
    addService: jest.fn((_svc: any, impl: any) => {
      capturedServerImpl = impl;
    }),
    bindAsync: jest.fn((_addr: any, _creds: any, cb: any) => cb(null)),
    forceShutdown: jest.fn(),
  };

  const mockServerCtor = jest.fn(() => mockServer);

  return {
    ...original,
    credentials: {
      createSsl: jest.fn(() => 'mock-credentials'),
    },
    ServerCredentials: {
      createSsl: jest.fn(() => 'mock-credentials'),
    },
    status: {
      ...original.status,
      INTERNAL: 13,
    },
    loadPackageDefinition: jest.fn(() => ({
      webui: {
        tokenization: {
          CentralSystem: CentralSystemMock,
          Peer2Peer: Peer2PeerMock,
        },
      },
    })),
    Server: mockServerCtor,
  };
});

describe('ConnectionManager', () => {
  let conn: ConnectionManager;
  const MOCK_CERT = Buffer.from('MOCK_CERT');
  const securityContext = new SecurityContext(MOCK_CERT, MOCK_CERT, MOCK_CERT, MOCK_CERT, MOCK_CERT);

  beforeEach(() => {
    jest.clearAllMocks();
    capturedServerImpl = null;
    global.fetch = jest.fn();
    conn = new ConnectionManager('dummy.proto', 'localhost:12345', securityContext);
  });

  afterAll(() => {
    // @ts-ignore
    delete global.fetch;
  });

  test('should initialize client with correct address', () => {
    expect(conn).toBeDefined();
    expect(grpc.loadPackageDefinition).toHaveBeenCalled();
    expect(CentralSystemMock).toHaveBeenCalledWith('localhost:12345', 'mock-credentials');
  });

  test('connectToCentralSystem() should set up stream listeners', () => {
    conn.connectToCentralSystem();

    expect(mockClient.ClientStream).toHaveBeenCalled();
    expect(mockStream.on).toHaveBeenCalledWith('data', expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith('end', expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith('error', expect.any(Function));
  });

  test('disconnectFromCentralSystem() should end stream', () => {
    conn.connectToCentralSystem();
    conn.disconnectFromCentralSystem();

    expect(mockStream.end).toHaveBeenCalled();
  });

  test("should reconnect on stream 'end'", () => {
    jest.useFakeTimers();
    conn.connectToCentralSystem();
    const onEnd = mockStream.on.mock.calls.find(([event]) => event === 'end')?.[1];

    onEnd?.(); // simulate 'end'
    jest.advanceTimersByTime(2000);

    expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test("should reconnect on stream 'error'", () => {
    jest.useFakeTimers();
    conn.connectToCentralSystem();
    const onError = mockStream.on.mock.calls.find(([event]) => event === 'error')?.[1];

    onError?.(new Error('Simulated error'));
    jest.advanceTimersByTime(2000);

    expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test("should dispatch event when 'data' is received", () => {
    conn.connectToCentralSystem();
    const onData = mockStream.on.mock.calls.find(([event]) => event === 'data')?.[1];

    const mockMessage = {
      event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
      data: {
        revokeToken: {
          token: 'abc123',
          targetAddress: 'peer-123',
        },
      },
    };

    onData?.(mockMessage);

    expect(mockDispatch).toHaveBeenCalledWith(mockMessage);
  });

  test('listenForPeers() should start server and register service', async () => {
    await conn.listenForPeers(50055, 'http://localhost:40041/api/');

    const serverCtor = (grpc.Server as any).mock;
    expect(serverCtor).toBeDefined();
    expect(serverCtor.calls.length).toBeGreaterThan(0);

    const serverInstance = serverCtor.results[0].value;
    expect(serverInstance.addService).toHaveBeenCalled();
    expect(serverInstance.bindAsync).toHaveBeenCalledWith('localhost:50055', expect.anything(), expect.any(Function));

    expect(capturedServerImpl).toBeTruthy();
    expect(typeof capturedServerImpl.Fetch).toBe('function');
  });

  test('p2p Fetch should register incoming receiving connection and forward request', async () => {
    await conn.listenForPeers(50056, 'http://localhost:40041/api/');

    // prepare data to call
    const call = {
      getPeer: () => 'client-42',
      request: {
        method: 'POST',
        path: 'echo',
        headers: { 'content-type': 'application/json' },
        body: Buffer.from(JSON.stringify({ ping: true })),
      },
    } as any;

    const callback = jest.fn();

    // @ts-ignore - mock global.fetch response
    global.fetch.mockResolvedValue({
      status: 202,
      headers: {
        forEach: (fn: (v: string, k: string) => void) => {
          fn('application/json', 'content-type');
          fn('test', 'x-extra');
        },
      },
      arrayBuffer: async () => Buffer.from(JSON.stringify({ ok: 1 })),
    });

    const before = conn.connections.receiving.length;
    await capturedServerImpl.Fetch(call, callback);

    expect(global.fetch).toHaveBeenCalledWith('http://localhost:40041/api/echo', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ping: true }),
    });

    // callback with response from forwarded fetch
    expect(callback).toHaveBeenCalledWith(null, {
      status: 202,
      headers: { 'content-type': 'application/json', 'x-extra': 'test' },
      body: expect.any(Buffer),
    });

    // connection receiving should be registered
    const after = conn.connections.receiving.length;
    expect(after).toBeGreaterThan(before);

    const rec = conn.getConnectionByAddress('client-42', ConnectionDirection.RECEIVING);
    expect(rec).toBeDefined();
  });

  test('p2p Fetch should return INTERNAL on forward error', async () => {
    await conn.listenForPeers(50057, 'http://localhost:40041/api/');

    const call = {
      getPeer: () => 'client-error',
      request: {
        method: 'GET',
        path: 'fail',
        headers: {},
      },
    } as any;

    const callback = jest.fn();

    // @ts-ignore
    global.fetch.mockRejectedValue(new Error('err'));

    await capturedServerImpl.Fetch(call, callback);

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        code: grpc.status.INTERNAL,
        message: 'err',
      })
    );
  });

  describe('createNewConnection', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should create new RECEIVING connection', async () => {
      const address = 'peer-receiving-1';
      const token = 'test-token-123';

      const connection = await conn.createNewConnection(address, ConnectionDirection.RECEIVING, token);

      expect(connection).toBeDefined();
      expect(connection.targetAddress).toBe(address);
      expect(connection.direction).toBe(ConnectionDirection.RECEIVING);
      expect(connection.token).toBe(token);
    });

    test('should create new SENDING connection with SSL tunnel', async () => {
      const address = 'peer-sending-1';
      const token = 'test-token-456';

      const connection = await conn.createNewConnection(address, ConnectionDirection.SENDING, token);

      expect(connection).toBeDefined();
      expect(connection.targetAddress).toBe(address);
      expect(connection.direction).toBe(ConnectionDirection.SENDING);
      expect(connection.token).toBe(token);
    });

    test('should return existing connection if already exists (RECEIVING)', async () => {
      const address = 'peer-existing-receiving';
      const token1 = 'token-1';
      const token2 = 'token-2';

      const conn1 = await conn.createNewConnection(address, ConnectionDirection.RECEIVING, token1);
      const conn2 = await conn.createNewConnection(address, ConnectionDirection.RECEIVING, token2);

      expect(conn1).toBe(conn2);
      expect(conn2.token).toBe(token2); // Token should be updated
    });

    test('should return existing connection if already exists (SENDING)', async () => {
      const address = 'peer-existing-sending';
      const token1 = 'token-1';
      const token2 = 'token-2';

      const conn1 = await conn.createNewConnection(address, ConnectionDirection.SENDING, token1);
      const conn2 = await conn.createNewConnection(address, ConnectionDirection.SENDING, token2);

      expect(conn1).toBe(conn2);
      expect(conn2.token).toBe(token2); // Token should be updated
    });

    test('should return existing connection without updating token if no token provided', async () => {
      const address = 'peer-no-token-update';
      const token1 = 'token-1';

      const conn1 = await conn.createNewConnection(address, ConnectionDirection.RECEIVING, token1);
      const conn2 = await conn.createNewConnection(address, ConnectionDirection.RECEIVING);

      expect(conn1).toBe(conn2);
      expect(conn2.token).toBe(token1); // Token should remain unchanged
    });

    test('should create connection without token', async () => {
      const address = 'peer-no-token';

      const connection = await conn.createNewConnection(address, ConnectionDirection.RECEIVING);

      expect(connection).toBeDefined();
      expect(connection.token).toBe('');
    });
  });

  describe('getConnectionByAddress', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should get SENDING connection by address', async () => {
      const address = 'peer-send-get';
      await conn.createNewConnection(address, ConnectionDirection.SENDING, 'token');

      const connection = conn.getConnectionByAddress(address, ConnectionDirection.SENDING);

      expect(connection).toBeDefined();
      expect(connection?.targetAddress).toBe(address);
    });

    test('should get RECEIVING connection by address', async () => {
      const address = 'peer-receive-get';
      await conn.createNewConnection(address, ConnectionDirection.RECEIVING, 'token');

      const connection = conn.getConnectionByAddress(address, ConnectionDirection.RECEIVING);

      expect(connection).toBeDefined();
      expect(connection?.targetAddress).toBe(address);
    });

    test('should return undefined for non-existent connection', () => {
      const connection = conn.getConnectionByAddress('non-existent', ConnectionDirection.SENDING);

      expect(connection).toBeUndefined();
    });
  });

  describe('getConnectionBySerialNumber', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should find connection by serial number in receiving connections', async () => {
      const address = 'peer-sn-receiving';
      const serialNumber = 'SN-12345';

      const connection = await conn.createNewConnection(address, ConnectionDirection.RECEIVING, 'token');
      connection.serialNumber = serialNumber;

      const found = conn.getConnectionBySerialNumber(serialNumber);

      expect(found).toBe(connection);
      expect(found?.serialNumber).toBe(serialNumber);
    });

    test('should find connection by serial number in sending connections', async () => {
      const address = 'peer-sn-sending';
      const serialNumber = 'SN-67890';

      const connection = await conn.createNewConnection(address, ConnectionDirection.SENDING, 'token');
      connection.serialNumber = serialNumber;

      const found = conn.getConnectionBySerialNumber(serialNumber);

      expect(found).toBe(connection);
      expect(found?.serialNumber).toBe(serialNumber);
    });

    test('should return undefined if serial number not found', () => {
      const found = conn.getConnectionBySerialNumber('non-existent-sn');

      expect(found).toBeUndefined();
    });
  });

  describe('listenForPeers edge cases', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      capturedServerImpl = null;
    });

    test('should not start listener if clientListenerCert is missing', async () => {
      const securityContextNoCert = new SecurityContext(MOCK_CERT, MOCK_CERT, MOCK_CERT, MOCK_CERT, undefined as any);
      const connNoCert = new ConnectionManager('dummy.proto', 'localhost:12345', securityContextNoCert);

      await connNoCert.listenForPeers(50058);

      const serverCtor = (grpc.Server as any).mock;
      // Server should not be created
      expect(serverCtor.calls.length).toBe(0);
    });

    test('should shutdown existing server before starting new one', async () => {
      await conn.listenForPeers(50059, 'http://localhost:40041/api/');

      const serverCtor = (grpc.Server as any).mock;
      const firstServer = serverCtor.results[0].value;

      // Start listener again
      await conn.listenForPeers(50060, 'http://localhost:40041/api/');

      expect(firstServer.forceShutdown).toHaveBeenCalled();
    });

    test('should use default baseAPIPath if not provided', async () => {
      await conn.listenForPeers(50061);

      expect(capturedServerImpl).toBeTruthy();
      expect(typeof capturedServerImpl.Fetch).toBe('function');
    });
  });
});
