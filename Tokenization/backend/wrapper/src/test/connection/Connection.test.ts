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

import { Connection } from '../../client/connection/Connection';
import { ConnectionStatus } from '../../models/connection.model';
// opcjonalnie można też użyć prawdziwego enumu:
// import { ConnectionDirection } from '../../models/message.model';

const FAKE_DIRECTION: any = 'SENDING';

let lastPeerClient: any;
const PeerCtorMock = jest.fn((_addr: string, _creds: any) => {
  lastPeerClient = {
    Fetch: jest.fn(),
  };
  return lastPeerClient;
});

const logger = {
  infoMessage: jest.fn(),
  errorMessage: jest.fn(),
};

jest.mock(
  '@grpc/grpc-js',
  () => {
    const original = jest.requireActual('@grpc/grpc-js');
    return {
      ...original,
      credentials: {
        createSsl: jest.fn(() => ({ insecure: true })),
      },
      LogManager: {
        getLogger: () => logger,
      },
    };
  },
  { virtual: true }
);

import * as grpc from '@grpc/grpc-js';
import { getTestCerts } from '../testCerts/testCerts';

describe('Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastPeerClient = undefined;
  });

  test('constructor should create connection and set base state correctly', () => {
    const certs = getTestCerts();
    const conn = new Connection('tok', 'peer:50051', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    expect(grpc.credentials.createSsl).toHaveBeenCalledWith(certs.caCert, certs.clientKey, certs.clientCert);
    expect(PeerCtorMock).toHaveBeenCalledWith('peer:50051', { insecure: true });

    expect(conn.token).toBe('tok');
    expect(conn.targetAddress).toBe('peer:50051');
    expect(conn.status).toBe(ConnectionStatus.CONNECTED);
    expect(conn.direction).toBe(FAKE_DIRECTION);
  });

  test('getter/setter for token should work', () => {
    const conn = new Connection('old', 'peer:1', FAKE_DIRECTION);
    expect(conn.token).toBe('old');
    conn.token = 'new-token';
    expect(conn.token).toBe('new-token');
  });

  test('handleRevokeToken should clear token and status to UNAUTHORIZED', () => {
    const conn = new Connection('secret', 'peer:x', FAKE_DIRECTION);
    conn.handleRevokeToken();
    expect(conn.token).toBe('');
    expect(conn.status).toBe(ConnectionStatus.UNAUTHORIZED);
  });

  test('getter/setter for status should work', () => {
    const conn = new Connection('t', 'a', FAKE_DIRECTION);
    conn.status = ConnectionStatus.UNAUTHORIZED;
    expect(conn.status).toBe(ConnectionStatus.UNAUTHORIZED);
    conn.status = ConnectionStatus.CONNECTED;
    expect(conn.status).toBe(ConnectionStatus.CONNECTED);
  });

  test('getter for targetAddress should work', () => {
    const conn = new Connection('t', 'host:1234', FAKE_DIRECTION);
    expect(conn.targetAddress).toBe('host:1234');
  });

  test('fetch should throw if peer client is not attached', async () => {
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    // peerClient celowo nie jest ustawiany (brak createSslTunnel/attachGrpcClient)
    // @ts-ignore
    conn['_peerClient'] = undefined;

    await expect(conn.fetch()).rejects.toThrow('Peer client not attached for addr');
  });

  test('fetch with defaults should work', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    lastPeerClient.Fetch.mockImplementation((req: any, metadata: any, cb: any) => {
      try {
        expect(req).toEqual({
          method: 'POST',
          path: '/',
          headers: {},
          body: Buffer.alloc(0),
        });

        expect(metadata).toBeInstanceOf(grpc.Metadata);
        expect(metadata.get('jwetoken')).toEqual(['t']);

        cb(null, { status: 200, headers: {}, body: Buffer.alloc(0) });
      } catch (e) {
        cb(e);
      }
    });

    const resp = await conn.fetch();
    expect(resp.status).toBe(200);
  });

  test('fetch builds request correctly and returns response', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    const body = Buffer.from('abc');

    lastPeerClient.Fetch.mockImplementation((req: any, metadata: any, cb: any) => {
      try {
        expect(req.method).toBe('PUT');
        expect(req.path).toBe('/api/a');
        expect(req.headers).toEqual({ 'x-a': '1' });
        expect(Buffer.isBuffer(req.body)).toBe(true);
        expect(req.body.equals(body)).toBe(true);

        expect(metadata).toBeInstanceOf(grpc.Metadata);
        expect(metadata.get('jwetoken')).toEqual(['t']);

        cb(null, {
          status: 201,
          headers: { 'content-type': 'text/plain' },
          body: Buffer.from('ok'),
        });
      } catch (e) {
        cb(e);
      }
    });

    const res = await conn.fetch({ method: 'put', path: '/api/a', headers: { 'x-a': '1' }, body });
    expect(res.status).toBe(201);
    expect(await res.text()).toBe('ok');
  });

  test('fetch should convert Uint8Array to Buffer', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    const body = new Uint8Array([1, 2, 3]);

    lastPeerClient.Fetch.mockImplementation((req: any, _metadata: any, cb: any) => {
      try {
        expect(Buffer.isBuffer(req.body)).toBe(true);
        expect(req.body.equals(Buffer.from([1, 2, 3]))).toBe(true);
        cb(null, { status: 200, headers: {}, body: Buffer.alloc(0) });
      } catch (e) {
        cb(e);
      }
    });

    const res = await conn.fetch({ body });
    expect(res.status).toBe(200);
  });

  test('fetch should convert string to Buffer', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    const body = 'żółć & äöü';

    lastPeerClient.Fetch.mockImplementation((req: any, _metadata: any, cb: any) => {
      try {
        expect(req.body.equals(Buffer.from(body, 'utf8'))).toBe(true);
        cb(null, { status: 200, headers: {}, body: Buffer.from('{"ok":true}') });
      } catch (e) {
        cb(e);
      }
    });

    const res = await conn.fetch({ method: 'post', path: '/p', headers: {}, body });
    expect(await res.json()).toEqual({ ok: true });
  });

  test('fetch should reject if body is not allowed', async () => {
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, getTestCerts());
    await expect(
      // @ts-ignore
      conn.fetch({ body: { not: 'allowed' } })
    ).rejects.toThrow('Body must be a string/Buffer/Uint8Array');
  });

  test('fetch should propagate errors from peer', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    const err = new Error('err');
    lastPeerClient.Fetch.mockImplementation((_req: any, _metadata: any, cb: any) => cb(err));

    await expect(conn.fetch({ method: 'GET', path: '/x' })).rejects.toThrow('err');
  });

  test('fetch should map response', async () => {
    const certs = getTestCerts();
    const conn = new Connection('t', 'addr', FAKE_DIRECTION);
    conn.createSslTunnel(PeerCtorMock, certs);

    const payload = { a: 1, b: 'x' };
    lastPeerClient.Fetch.mockImplementation((_req: any, _metadata: any, cb: any) =>
      cb(null, {
        headers: { 'x-k': 'v' },
        body: Buffer.from(JSON.stringify(payload)),
      })
    );

    const res = await conn.fetch({ method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.headers).toEqual({ 'x-k': 'v' });
    expect(Buffer.isBuffer(res.body)).toBe(true);
    expect(await res.text()).toBe(JSON.stringify(payload));
    expect(await res.json()).toEqual(payload);
  });
});
