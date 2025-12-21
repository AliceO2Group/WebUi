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
import { Connection } from '../../../client/connection/Connection';
import { importPKCS8, importJWK, compactDecrypt, compactVerify } from 'jose';
import { ConnectionStatus } from '../../../models/connection.model';
import { ConnectionDirection } from '../../../models/message.model';
import { SecurityContext } from '../../../utils/security/SecurityContext';
import { ConnectionManager } from '../ConnectionManager';
import { TOKEN_REASON_HEADER, TOKEN_TARGET_HEADER, TokenAuthReason, TokenPayload } from '../../../models/token.model';
import { AlertCode, AlertContext, makeAlert, codeFromTokenReason } from '../../../models/alert.model';

/**
 * Interceptor function responsible for JWE decryption, JWS verification,
 * certificate serial number matching (mTLS binding), and basic authorization.
 */
export class GRPCAuthInterceptor {
  /**
   * Creates a new instance of GRPCAuthInterceptor.
   *
   * @param connectionManager - Instance of ConnectionManager used to retrieve active connections.
   * @param securityContext - Instance of SecurityContext used to access certificates and keys for JWE decryption and JWS verification.
   */
  constructor(private connectionManager: ConnectionManager, private securityContext: SecurityContext) {}

  public async validate(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<{ isAuthenticated: Boolean; conn: Connection | undefined }> {
    const metadata = call.metadata.getMap();
    const jweToken = metadata.jwetoken as string;
    const clientAddress = call.getPeer();
    let conn = this.connectionManager.getConnectionByAddress(clientAddress, ConnectionDirection.RECEIVING);
    const peerCert = GRPCAuthInterceptor.getPeerCertFromCall(call);

    // Check if token exists
    if (!jweToken) {
      return this.alertAndFail(call, callback, conn, grpc.status.UNAUTHENTICATED, 'No token provided', TokenAuthReason.NO_TOKEN, {
        peer: clientAddress,
        peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
        token: jweToken,
        method: String(call.request?.method || 'POST').toUpperCase(),
        url: call.request?.path,
        status: grpc.status.UNAUTHENTICATED,
        addr: clientAddress,
        ms: Date.now(),
      });
    }

    // Check if connection exists
    if (conn) {
      // Check if connection is blocked
      if (conn.status === ConnectionStatus.BLOCKED) {
        return this.alertAndFail(call, callback, conn, grpc.status.UNAUTHENTICATED, 'No token provided', TokenAuthReason.NO_TOKEN, {
          peer: clientAddress,
          peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
          token: jweToken,
          method: String(call.request?.method || 'POST').toUpperCase(),
          url: call.request?.path,
          status: grpc.status.UNAUTHENTICATED,
          addr: clientAddress,
          ms: Date.now(),
        });
      }

      if (conn.token === jweToken) {
        // check for allowed requests and serial number match if token is the same
        const isReqAllowed = GRPCAuthInterceptor.isRequestAllowed(conn.cachedTokenPayload, call.request);
        if (!isReqAllowed.isAllowed) {
          return this.alertAndFail(
            call,
            callback,
            conn,
            grpc.status.PERMISSION_DENIED,
            'Method not allowed',
            isReqAllowed.isUnexpired ? TokenAuthReason.PERMISSION_FORBIDDEN : TokenAuthReason.PERMISSION_EXPIRED,
            {
              method: String(call.request?.method || 'POST').toUpperCase(),
              peer: clientAddress,
              peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
              token: jweToken,
              url: call.request?.path,
              status: grpc.status.UNAUTHENTICATED,
              addr: clientAddress,
              ms: Date.now(),
            }
          );
        }

        if (!GRPCAuthInterceptor.isSerialNumberMatching(conn.cachedTokenPayload, peerCert)) {
          conn.handleFailedAuth();
          return this.alertAndFail(
            call,
            callback,
            conn,
            grpc.status.UNAUTHENTICATED,
            'Serial number mismatch',
            TokenAuthReason.SERIAL_MISMATCH,
            {
              method: String(call.request?.method || 'POST').toUpperCase(),
              peer: clientAddress,
              peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
              tokenSN: GRPCAuthInterceptor.normalizeSerial(conn.cachedTokenPayload?.sub),
              token: jweToken,
              url: call.request?.path,
              status: grpc.status.UNAUTHENTICATED,
              addr: clientAddress,
              ms: Date.now(),
            }
          );
        }

        return { isAuthenticated: true, conn };
      }
    } else {
      conn = await this.connectionManager.createNewConnection(clientAddress, ConnectionDirection.RECEIVING, jweToken);
    }

    // New connection - need to authenticate
    // JWE decryption (RSA-OAEP-256) -> JWS (Plaintext)
    let privateKey: any;
    let jwsToken: string;
    try {
      // Importing RSA private key for decryption
      privateKey = await importPKCS8(this.securityContext.clientPrivateKey.toString('utf-8'), 'RSA-OAEP-256');

      const { plaintext } = await compactDecrypt(jweToken, privateKey);
      jwsToken = new TextDecoder().decode(plaintext).trim();
    } catch (e: any) {
      return this.alertAndFail(
        call,
        callback,
        conn,
        grpc.status.UNAUTHENTICATED,
        'Incorrect token provided (JWE Decryption failed)',
        TokenAuthReason.JWE_DECRYPT_FAIL,
        {
          method: String(call.request?.method || 'POST').toUpperCase(),
          peer: clientAddress,
          peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
          token: jweToken,
          url: call.request?.path,
          status: grpc.status.UNAUTHENTICATED,
          addr: clientAddress,
          err: e.message,
          ms: Date.now(),
        }
      );
    }

    // Verify JWS (With signature) and payload extraction
    let pub: any;
    let payload: TokenPayload;

    try {
      // Convert a raw Base64 Ed25519 public key to JWK format
      const jwk = {
        kty: 'OKP',
        crv: 'Ed25519',
        x: Buffer.from(this.securityContext.JWS_PUBLIC_KEY, 'base64').toString('base64url'),
      };

      // Importing the Ed25519 public key for verification - using "EdDSA" algorithm
      pub = await importJWK(jwk, 'EdDSA');

      // Compact verify - verify with key and decode the JWS token in one step
      const { payload: jwtPayload, protectedHeader } = await compactVerify(jwsToken, pub);

      // Additional check to ensure correct signing algorithm was used
      if (protectedHeader.alg !== 'EdDSA' && protectedHeader.alg !== 'Ed25519') {
        return this.alertAndFail(
          call,
          callback,
          conn,
          grpc.status.UNAUTHENTICATED,
          'Incorrect signing algorithm for JWS.',
          TokenAuthReason.JWS_INVALID,
          {
            method: String(call.request?.method || 'POST').toUpperCase(),
            peer: clientAddress,
            peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
            token: jweToken,
            url: call.request?.path,
            status: grpc.status.UNAUTHENTICATED,
            addr: clientAddress,
            err: 'Incorrect signing algorithm for JWS',
            alg: protectedHeader.alg,
            ms: Date.now(),
          }
        );
      }

      // Decode and parse the JWT payload
      const payloadString = new TextDecoder().decode(jwtPayload);
      payload = JSON.parse(payloadString);
    } catch (e: any) {
      return this.alertAndFail(
        call,
        callback,
        conn,
        grpc.status.UNAUTHENTICATED,
        'JWS Verification error: Invalid signature',
        TokenAuthReason.JWS_INVALID,
        {
          method: String(call.request?.method || 'POST').toUpperCase(),
          peer: clientAddress,
          peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
          token: jweToken,
          url: call.request?.path,
          status: grpc.status.UNAUTHENTICATED,
          addr: clientAddress,
          err: e.message,
          ms: Date.now(),
        }
      );
    }

    // mTLS binding check and authorization
    // Connection tunnel verification with serialNumber (mTLS SN vs Token SN)
    if (!GRPCAuthInterceptor.isSerialNumberMatching(payload, peerCert)) {
      conn.handleFailedAuth();
      return this.alertAndFail(call, callback, conn, grpc.status.UNAUTHENTICATED, 'Serial number mismatch', TokenAuthReason.SERIAL_MISMATCH, {
        method: String(call.request?.method || 'POST').toUpperCase(),
        peer: clientAddress,
        peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
        tokenSN: GRPCAuthInterceptor.normalizeSerial(payload?.sub),
        token: jweToken,
        url: call.request?.path,
        status: grpc.status.UNAUTHENTICATED,
        addr: clientAddress,
        ms: Date.now(),
      });
    }

    // Validate permission for request method (Authorization check)
    const isReqAllowed = GRPCAuthInterceptor.isRequestAllowed(conn.cachedTokenPayload, call.request);
    if (!isReqAllowed.isAllowed) {
      return this.alertAndFail(
        call,
        callback,
        conn,
        grpc.status.PERMISSION_DENIED,
        'Method not allowed',
        isReqAllowed.isUnexpired ? TokenAuthReason.PERMISSION_FORBIDDEN : TokenAuthReason.PERMISSION_EXPIRED,
        {
          method: String(call.request?.method || 'POST').toUpperCase(),
          peer: clientAddress,
          peerSN: GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber),
          token: jweToken,
          url: call.request?.path,
          status: grpc.status.UNAUTHENTICATED,
          addr: clientAddress,
          exp: (conn.cachedTokenPayload as TokenPayload)?.exp?.[String(call.request?.method || 'POST').toUpperCase()],
          ms: Date.now(),
        }
      );
    }

    // Authentication and Authorization successful
    // Update Connection state with SN and status
    conn.handleSuccessfulAuth(payload);
    return { isAuthenticated: true, conn };
  }

  /**
   * @description Checks if the request method is allowed based on the token permissions.
   * @param tokenPayload payload extracted from the token
   * @param request gRPC request object containing method information
   * @param callback callback to return gRPC error if needed
   * @returns true if request method is allowed, false otherwise
   */
  public static isRequestAllowed(tokenPayload: TokenPayload | undefined, request: any): { isAllowed: boolean; isUnexpired: boolean } {
    const method = String(request?.method || 'POST').toUpperCase();
    const isValidPayload = GRPCAuthInterceptor.validateTokenPayload(tokenPayload, request.method);
    let isUnexpired = true;

    if (isValidPayload) {
      isUnexpired = GRPCAuthInterceptor.isPermissionUnexpired(
        (tokenPayload as TokenPayload).iat[method],
        (tokenPayload as TokenPayload).exp[method]
      );
    }

    if (!isValidPayload || !isUnexpired) {
      return { isAllowed: false, isUnexpired: isUnexpired };
    }

    return { isAllowed: true, isUnexpired: isUnexpired };
  }

  /**
   * @description Validates the structure and types of the token payload.
   * @returns true if token payload is valid, false otherwise
   */
  private static validateTokenPayload(tokenPayload: TokenPayload | undefined, method: string): tokenPayload is TokenPayload {
    if (!tokenPayload) {
      return false;
    }

    if (
      typeof tokenPayload.iat !== 'object' ||
      typeof tokenPayload.exp !== 'object' ||
      typeof tokenPayload.sub !== 'string' ||
      typeof tokenPayload.aud !== 'string' ||
      typeof tokenPayload.iss !== 'string' ||
      typeof tokenPayload.jti !== 'string' ||
      Object.keys(tokenPayload.iat).length === 0 ||
      Object.keys(tokenPayload.exp).length === 0 ||
      !tokenPayload.iat.hasOwnProperty(method) ||
      !tokenPayload.exp.hasOwnProperty(method)
    ) {
      return false;
    }

    return true;
  }

  /**
   * @description Checks if the permissions granted in the token have expired.
   * @param iat issued-at timestamp for the specific method
   * @param exp expiration timestamp for the specific method
   * @returns true if permission is still valid, false if expired
   */
  public static isPermissionUnexpired(iat: number, exp: number): boolean {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (nowInSeconds >= exp) {
      return false;
    }

    if (iat > nowInSeconds) {
      return false;
    }

    return true;
  }

  /**
   * @description Checks if the serial number from the peer certificate matches the one in the token payload.
   * @param tokenPayload payload extracted from the token
   * @param peerCert certificate object retrieved from the gRPC call
   * @param callback callback to return gRPC error if needed
   * @returns true if serial numbers match, false otherwise
   */
  public static isSerialNumberMatching(tokenPayload: TokenPayload | undefined, peerCert: any): Boolean {
    const clientSN = GRPCAuthInterceptor.normalizeSerial(peerCert?.serialNumber);
    const tokenSN = GRPCAuthInterceptor.normalizeSerial(tokenPayload?.sub);

    if (!clientSN || clientSN !== tokenSN) {
      return false;
    }
    return true;
  }

  /**
   * @description Normalizes a certificate serial number by removing colons and converting to uppercase.
   * @param sn serial number string possibly containing colons or being null/undefined
   * @returns normalized serial number string
   */
  private static normalizeSerial(sn?: string | null): string {
    // Node retrieves serial number as hex string, without leading 0x and with possible colons so we need to normalize it
    return (sn || '').replace(/[^0-9a-f]/gi, '').toUpperCase();
  }

  /**
   * @description Retrieves the peer certificate from the gRPC call object.
   * @param call gRPC call object
   * @returns peer certificate object from the gRPC call
   */
  public static getPeerCertFromCall(call: any) {
    const session = call?.call?.stream?.session;
    const sock = session?.socket as any;
    return sock?.getPeerCertificate(true); // whole certificate info from TLS socket
  }

  /**
   * Prosty helper: wyślij alert do centrali i jednocześnie zwróć błąd gRPC.
   * Używa mapowania TokenAuthReason -> AlertCode, ale możesz podać własny override przez ctx.
   */
  private alertAndFail(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
    conn: Connection | undefined,
    code: grpc.status,
    msg: string,
    reason: TokenAuthReason,
    ctx: AlertContext = {}
  ) {
    const alertCode: AlertCode = codeFromTokenReason(reason);
    this.connectionManager.sendCentralAlert(makeAlert(alertCode, ctx));

    const md = new grpc.Metadata();
    md.set(TOKEN_REASON_HEADER, reason);
    md.set(TOKEN_TARGET_HEADER, call.getPeer() || '');
    const err = Object.assign(new Error(msg), { code, metadata: md });
    callback(err, null);

    return { isAuthenticated: false, conn };
  }
}
