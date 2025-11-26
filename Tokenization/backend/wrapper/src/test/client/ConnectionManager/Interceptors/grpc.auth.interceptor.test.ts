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
import * as jose from 'jose';
import * as interceptor from '../../../../client/connectionManager/Interceptors/grpc.auth.interceptor';

// Connection class mock
jest.mock(
  '../../../../client/Connection/Connection',
  () => {
    return {
      Connection: jest.fn().mockImplementation((jweToken: string, address: string, direction: any) => {
        return {
          jweToken,
          address,
          direction,
          status: 1,
          payload: { subSerialNumber: 'AABBCC', perm: { POST: true } },
          getStatus: jest.fn(function () {
            return this.status;
          }),
          getToken: jest.fn(function () {
            return this.jweToken;
          }),
          getCachedTokenPayload: jest.fn(function () {
            return this.payload;
          }),
          handleFailedAuth: jest.fn(),
          handleSuccessfulAuth: jest.fn(function (p: any) {
            this.payload = p;
            this.status = 1;
          }),
        };
      }),
    };
  },
  { virtual: true }
);

import { Connection } from '../../../../client/connection/Connection';

jest.mock('jose', () => ({
  importPKCS8: jest.fn(),
  importJWK: jest.fn(),
  compactDecrypt: jest.fn(),
  compactVerify: jest.fn(),
}));

import { ConnectionStatus, TokenPayload } from '../../../../models/connection.model';
import { SecurityContext } from '../../../../utils/security/SecurityContext';
import { ConnectionDirection } from '../../../../models/message.model';

const mockSecurityContext = {
  clientPrivateKey: Buffer.from('mock_private_key_rsa'),
  JWS_PUBLIC_KEY: 'mock_public_key_ed25519',
} as unknown as SecurityContext;

let isRequestAllowedSpy: jest.SpyInstance;
let isSerialNumberMatchingSpy: jest.SpyInstance;
let getPeerCertFromCallSpy: jest.SpyInstance;

const mockCall = {
  metadata: { getMap: jest.fn(() => ({})) },
  getPeer: jest.fn(() => 'ipv4:127.0.0.1:12345'),
  request: { method: 'POST' },
} as unknown as grpc.ServerUnaryCall<any, any>;

const mockCallback = jest.fn();
const mockClientConnections = new Map<string, any>();

describe('gRPCAuthInterceptor', () => {
  const MOCK_ADDRESS = 'ipv4:127.0.0.1:12345';
  const VALID_JWE = 'valid.jwe.token';
  const VALID_JWS = 'valid.jws.token';
  const DECRYPTED_PAYLOAD: TokenPayload = {
    subSerialNumber: 'DDEEFF',
    perm: { POST: true, GET: false },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClientConnections.clear();

    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({
      jwetoken: VALID_JWE,
    });
    (mockCall.getPeer as unknown as jest.Mock).mockReturnValue(MOCK_ADDRESS);
    (mockCall as any).request = { method: 'POST' };

    (jose.importPKCS8 as jest.Mock).mockResolvedValue('mock_priv_key');
    (jose.compactDecrypt as jest.Mock).mockResolvedValue({
      plaintext: Buffer.from(VALID_JWS),
    });
    (jose.importJWK as jest.Mock).mockResolvedValue('mock_pub_key');
    (jose.compactVerify as jest.Mock).mockResolvedValue({
      payload: Buffer.from(JSON.stringify(DECRYPTED_PAYLOAD)),
      protectedHeader: { alg: 'EdDSA' },
    });

    // mocks of internal functions
    isRequestAllowedSpy = jest.spyOn(interceptor, 'isRequestAllowed').mockImplementation((_p, _r, _cb) => true);

    isSerialNumberMatchingSpy = jest.spyOn(interceptor, 'isSerialNumberMatching').mockImplementation((_p, _pc, _cb) => true);

    getPeerCertFromCallSpy = jest.spyOn(interceptor, 'getPeerCertFromCall').mockReturnValue({ serialNumber: 'DDEEFF' });
  });

  const getCreatedConn = () => {
    const instances = (Connection as jest.Mock).mock?.instances ?? [];
    return instances.find((i: any) => i.address === MOCK_ADDRESS) ?? mockClientConnections.get(MOCK_ADDRESS);
  };

  it('should fail if no JWE token is provided in the metadata', async () => {
    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({});

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    expect(result.isAuthenticated).toBe(false);
    expect(result.conn).toBe(null);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        code: grpc.status.UNAUTHENTICATED,
        message: 'No token provided',
      }),
      null
    );
  });

  it("should authenticate instantly if connection exists and token hasn't changed", async () => {
    const existingConn = new (Connection as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue(VALID_JWE);
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    expect(result.isAuthenticated).toBe(true);
    expect(result.conn).toBe(existingConn);
    expect(isRequestAllowedSpy).toHaveBeenCalledTimes(1);
    expect(isSerialNumberMatchingSpy).toHaveBeenCalledTimes(1);
    expect(jose.compactDecrypt as jest.Mock).not.toHaveBeenCalled();
  });

  it('should reject if connection exists but is BLOCKED', async () => {
    const existingConn = new (Connection as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.status = ConnectionStatus.BLOCKED;
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    expect(result.isAuthenticated).toBe(false);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        code: grpc.status.UNAUTHENTICATED,
        message: 'Connection is blocked. Contact administrator.',
      }),
      null
    );
  });

  it('should reject existing connection on serial number mismatch', async () => {
    const existingConn = new (Connection as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue(VALID_JWE);
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    // mock serial number mismatch
    isSerialNumberMatchingSpy.mockImplementation((_p, _pc, cb) => {
      cb(
        {
          name: 'AuthenticationError',
          code: grpc.status.PERMISSION_DENIED,
          message: 'Serial number mismatch (mTLS binding failure).',
        } as any,
        null
      );
      return false;
    });

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    expect(result.isAuthenticated).toBe(false);
    expect(existingConn.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Serial number mismatch (mTLS binding failure).',
      }),
      null
    );
  });

  it('should successfully authenticate a NEW connection', async () => {
    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({
      jwetoken: 'NEW.JWE.TOKEN',
    });

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(true);
    expect(created).toBeDefined();
    expect(created!.handleSuccessfulAuth).toHaveBeenCalledWith(DECRYPTED_PAYLOAD);
    expect(jose.compactDecrypt as jest.Mock).toHaveBeenCalledTimes(1);
    expect(jose.compactVerify as jest.Mock).toHaveBeenCalledTimes(1);
    expect(isSerialNumberMatchingSpy).toHaveBeenCalledTimes(1);
    expect(isRequestAllowedSpy).toHaveBeenCalledTimes(1);
  });

  it('should fail if JWE decryption fails', async () => {
    (jose.compactDecrypt as jest.Mock).mockRejectedValue(new Error('Decryption failed'));

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    expect(created!.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Incorrect token provided (JWE Decryption failed)',
      }),
      null
    );
  });

  it('should fail if JWS verification fails', async () => {
    (jose.compactVerify as jest.Mock).mockRejectedValue(new Error('Invalid signature'));

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    expect(created!.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'JWS Verification error: Invalid signature',
      }),
      null
    );
  });

  it('should fail if mTLS serial number mismatch occurs after decryption', async () => {
    isSerialNumberMatchingSpy.mockImplementation((_p, _pc, cb) => {
      cb(
        {
          name: 'AuthenticationError',
          code: grpc.status.PERMISSION_DENIED,
          message: 'Serial number mismatch (mTLS binding failure).',
        } as any,
        null
      );
      return false;
    });

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    expect(created!.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Serial number mismatch (mTLS binding failure).',
      }),
      null
    );
  });

  it('should fail if request authorization check fails', async () => {
    isRequestAllowedSpy.mockImplementation((_p, _r, cb) => {
      cb(
        {
          name: 'AuthorizationError',
          code: grpc.status.PERMISSION_DENIED,
          message: 'Request of type POST is not allowed by the token policy.',
        } as any,
        null
      );
      return false;
    });

    const result = await interceptor.gRPCAuthInterceptor(mockCall, mockCallback, mockClientConnections as any, mockSecurityContext);

    expect(result.isAuthenticated).toBe(false);
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: grpc.status.PERMISSION_DENIED }), null);
    expect(isSerialNumberMatchingSpy).toHaveBeenCalledTimes(1);
  });
});
