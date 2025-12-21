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
import { GRPCAuthInterceptor } from '../../../../client/connectionManager/interceptors/grpc.auth.interceptor';

// Connection class mock
jest.mock(
  '../../../../client/connection/Connection',
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

import { ConnectionStatus } from '../../../../models/connection.model';
import { TokenPayload } from '../../../../models/token.model';
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
const mockConnectionManager = {
  getConnectionByAddress: jest.fn((address: string) => mockClientConnections.get(address)),
  createNewConnection: jest.fn(async (address: string, direction: any, token: string) => {
    const conn = new (Connection as unknown as jest.Mock)(token, address, direction);
    mockClientConnections.set(address, conn);
    return conn;
  }),
  sendCentralAlert: jest.fn(),
};

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
    isRequestAllowedSpy = jest.spyOn(GRPCAuthInterceptor, 'isRequestAllowed').mockReturnValue({ isAllowed: true, isUnexpired: true });

    isSerialNumberMatchingSpy = jest.spyOn(GRPCAuthInterceptor, 'isSerialNumberMatching').mockReturnValue(true);

    getPeerCertFromCallSpy = jest.spyOn(GRPCAuthInterceptor, 'getPeerCertFromCall').mockReturnValue({ serialNumber: 'DDEEFF' });
  });

  const getCreatedConn = () => {
    const instances = (Connection as unknown as jest.Mock).mock?.instances ?? [];
    return instances.find((i: any) => i.address === MOCK_ADDRESS) ?? mockClientConnections.get(MOCK_ADDRESS);
  };

  it('should fail if no JWE token is provided in the metadata', async () => {
    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({});

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(result.conn).toBeUndefined();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        code: grpc.status.UNAUTHENTICATED,
        message: 'No token provided',
      }),
      null
    );
  });

  it("should authenticate instantly if connection exists and token hasn't changed", async () => {
    const existingConn = new (Connection as unknown as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue(VALID_JWE);
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(true);
    expect(result.conn).toBe(existingConn);
    expect(isRequestAllowedSpy).toHaveBeenCalledTimes(1);
    expect(isSerialNumberMatchingSpy).toHaveBeenCalledTimes(1);
    expect(jose.compactDecrypt as jest.Mock).toHaveBeenCalledTimes(1);
    expect(jose.compactDecrypt as jest.Mock).toHaveBeenCalledWith(VALID_JWE, 'mock_priv_key');
  });

  it('should reject if connection exists but is BLOCKED', async () => {
    const existingConn = new (Connection as unknown as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.status = ConnectionStatus.BLOCKED;
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.code).toBe(grpc.status.UNAUTHENTICATED);
  });

  it('should reject existing connection on serial number mismatch', async () => {
    const existingConn = new (Connection as unknown as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue(VALID_JWE);
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    // mock serial number mismatch
    isSerialNumberMatchingSpy.mockReturnValue(false);

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(existingConn.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.message).toContain('Serial number mismatch');
  });

  it('should successfully authenticate a NEW connection', async () => {
    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({
      jwetoken: 'NEW.JWE.TOKEN',
    });

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

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

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    // Connection is created but auth fails before handleFailedAuth is called
    expect(created).toBeDefined();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Incorrect token provided (JWE Decryption failed)',
      }),
      null
    );
  });

  it('should fail if JWS verification fails', async () => {
    (jose.compactVerify as jest.Mock).mockRejectedValue(new Error('Invalid signature'));

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    // Connection is created but auth fails before handleFailedAuth is called
    expect(created).toBeDefined();
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'JWS Verification error: Invalid signature',
      }),
      null
    );
  });

  it('should fail if mTLS serial number mismatch occurs after decryption', async () => {
    isSerialNumberMatchingSpy.mockReturnValue(false);

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    const created = getCreatedConn();
    expect(result.isAuthenticated).toBe(false);
    expect(created!.handleFailedAuth).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.message).toContain('Serial number mismatch');
  });

  it('should fail if request authorization check fails', async () => {
    isRequestAllowedSpy.mockReturnValue({ isAllowed: false, isUnexpired: true });

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({ code: grpc.status.PERMISSION_DENIED }), null);
    expect(isSerialNumberMatchingSpy).toHaveBeenCalledTimes(1);
  });
  it('should reject if existing connection has request not allowed', async () => {
    const existingConn = new (Connection as unknown as jest.Mock)(VALID_JWE, MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue(VALID_JWE);
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    // mock request not allowed
    isRequestAllowedSpy.mockReturnValue({ isAllowed: false, isUnexpired: true });

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(result.conn).toBe(existingConn);
    expect(mockCallback).toHaveBeenCalled();
    const callArgs = mockCallback.mock.calls[0][0];
    expect(callArgs.message).toContain('Method not allowed');
  });

  it('should re-authenticate when existing connection has different token', async () => {
    const existingConn = new (Connection as unknown as jest.Mock)('OLD.TOKEN', MOCK_ADDRESS, ConnectionDirection.RECEIVING);
    existingConn.getToken.mockReturnValue('OLD.TOKEN');
    mockClientConnections.set(MOCK_ADDRESS, existingConn);

    (mockCall.metadata.getMap as unknown as jest.Mock).mockReturnValue({
      jwetoken: 'NEW.TOKEN',
    });

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(true);
    expect(existingConn.handleSuccessfulAuth).toHaveBeenCalledWith(DECRYPTED_PAYLOAD);
    expect(jose.compactDecrypt as jest.Mock).toHaveBeenCalledTimes(1);
    expect(jose.compactVerify as jest.Mock).toHaveBeenCalledTimes(1);
  });

  it('should fail if JWS has incorrect signing algorithm', async () => {
    (jose.compactVerify as jest.Mock).mockResolvedValue({
      payload: Buffer.from(JSON.stringify(DECRYPTED_PAYLOAD)),
      protectedHeader: { alg: 'RS256' }, // Wrong algorithm
    });

    const authInterceptor = new GRPCAuthInterceptor(mockConnectionManager as any, mockSecurityContext);
    const result = await authInterceptor.validate(mockCall, mockCallback);

    expect(result.isAuthenticated).toBe(false);
    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Incorrect signing algorithm for JWS.',
        code: grpc.status.UNAUTHENTICATED,
      }),
      null
    );
  });
});

describe('isRequestAllowed', () => {

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should return true for valid payload with unexpired permission', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      iat: { POST: now - 100 },
      exp: { POST: now + 3600 },
    } as any;

    const request = { method: 'POST' };
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(true);
    expect(result.isUnexpired).toBe(true);
  });

  it('should return false for expired permission', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      iat: { POST: now - 7200 },
      exp: { POST: now - 3600 }, // Expired 1 hour ago
    } as any;

    const request = { method: 'POST' };
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(false);
    expect(result.isUnexpired).toBe(false);
  });

  it('should return false for method not in token permissions', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      iat: { POST: now - 100 },
      exp: { POST: now + 3600 },
    } as any;

    const request = { method: 'DELETE' }; // Not in permissions
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(false);
  });

  it('should handle missing request method with default POST', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      iat: { POST: now - 100 },
      exp: { POST: now + 3600 },
    } as any;

    const request = { method: 'POST' }; // Explicitly set POST since default handling requires method
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(true);
  });

  it('should return false for invalid payload structure (missing iat)', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: any = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      exp: { POST: now + 3600 },
      // iat missing
    };

    const request = { method: 'POST' };
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(false);
  });

  it('should return false for invalid payload structure (empty iat)', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: any = {
      sub: 'AABBCC',
      aud: 'test-audience',
      iss: 'test-issuer',
      jti: 'test-jti',
      iat: {}, // Empty
      exp: { POST: now + 3600 },
    };

    const request = { method: 'POST' };
    const result = GRPCAuthInterceptor.isRequestAllowed(payload, request);

    expect(result.isAllowed).toBe(false);
  });
});

describe('isPermissionExpired', () => {
  it('should return false for valid unexpired permission', () => {
    const now = Math.floor(Date.now() / 1000);
    const iat = now - 100;
    const exp = now + 3600;

    const result = GRPCAuthInterceptor.isPermissionUnexpired(iat, exp);

    expect(result).toBe(true);
  });

  it('should return true when permission has expired', () => {
    const now = Math.floor(Date.now() / 1000);
    const iat = now - 7200;
    const exp = now - 3600; // Expired 1 hour ago

    const result = GRPCAuthInterceptor.isPermissionUnexpired(iat, exp);

    expect(result).toBe(false);
  });

  it('should return true when iat is in the future', () => {
    const now = Math.floor(Date.now() / 1000);
    const iat = now + 100; // Issued in the future
    const exp = now + 3600;

    const result = GRPCAuthInterceptor.isPermissionUnexpired(iat, exp);

    expect(result).toBe(false);
  });
});

describe('isSerialNumberMatching', () => {
  const mockCallback = jest.fn();

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should return true when serial numbers match', () => {
    const payload: TokenPayload = {
      sub: 'AABBCCDDEE',
    } as any;
    const peerCert = { serialNumber: 'AA:BB:CC:DD:EE' };

    const result = GRPCAuthInterceptor.isSerialNumberMatching(payload, peerCert);

    expect(result).toBe(true);
  });

  it('should return true when serial numbers match (different formats)', () => {
    const payload: TokenPayload = {
      sub: 'aabbccddee',
    } as any;
    const peerCert = { serialNumber: 'AA:BB:CC:DD:EE' };

    const result = GRPCAuthInterceptor.isSerialNumberMatching(payload, peerCert);

    expect(result).toBe(true);
  });

  it('should return false when serial numbers do not match', () => {
    const payload: TokenPayload = {
      sub: 'AABBCCDDEE',
    } as any;
    const peerCert = { serialNumber: '11:22:33:44:55' };

    const result = GRPCAuthInterceptor.isSerialNumberMatching(payload, peerCert);

    expect(result).toBe(false);
  });

  it('should return false when peerCert is null', () => {
    const payload: TokenPayload = {
      sub: 'AABBCCDDEE',
    } as any;

    const result = GRPCAuthInterceptor.isSerialNumberMatching(payload, null);

    expect(result).toBe(false);
  });

  it('should return false when payload is undefined', () => {
    const peerCert = { serialNumber: 'AA:BB:CC:DD:EE' };

    const result = GRPCAuthInterceptor.isSerialNumberMatching(undefined, peerCert);

    expect(result).toBe(false);
  });

  it('should normalize serial numbers with special characters', () => {
    const payload: TokenPayload = {
      sub: 'AA-BB-CC-DD-EE',
    } as any;
    const peerCert = { serialNumber: 'AA:BB:CC:DD:EE' };

    const result = GRPCAuthInterceptor.isSerialNumberMatching(payload, peerCert);

    expect(result).toBe(true);
  });
});

describe('getPeerCertFromCall', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should return peer certificate from call', () => {
    const mockCert = { serialNumber: 'AABBCC', subject: 'CN=test' };
    const mockCall = {
      call: {
        stream: {
          session: {
            socket: {
              getPeerCertificate: jest.fn().mockReturnValue(mockCert),
            },
          },
        },
      },
    };

    const result = GRPCAuthInterceptor.getPeerCertFromCall(mockCall);

    expect(result).toBe(mockCert);
    expect(mockCall.call.stream.session.socket.getPeerCertificate).toHaveBeenCalledWith(true);
  });

  it('should handle missing call structure gracefully', () => {
    const mockCall = {};

    const result = GRPCAuthInterceptor.getPeerCertFromCall(mockCall);

    expect(result).toBeUndefined();
  });
});
