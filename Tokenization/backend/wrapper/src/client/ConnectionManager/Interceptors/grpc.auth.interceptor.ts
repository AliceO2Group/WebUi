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

import * as grpc from "@grpc/grpc-js";
import { Connection } from "../../../client/Connection/Connection";
import { importPKCS8, importJWK, compactDecrypt, compactVerify } from "jose";
import {
  ConnectionStatus,
  TokenPayload,
} from "../../../models/connection.model";
import { ConnectionDirection } from "../../../models/message.model";
import { SecurityContext } from "../../../utils/security/SecurityContext";

/**
 * @description gRPC interceptor function responsible for JWE decryption, JWS verification,
 * certificate serial number matching (mTLS binding), and basic authorization.
 */
export const gRPCAuthInterceptor = async (
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
  clientConnections: Map<string, Connection>,
  securityContext: SecurityContext
): Promise<{ isAuthenticated: Boolean; conn: Connection | null }> => {
  const metadata = call.metadata.getMap();
  const jweToken = metadata.jwetoken as string;
  const clientAddress = call.getPeer();
  let conn = clientConnections.get(clientAddress);
  const peerCert = getPeerCertFromCall(call);

  // Check if token exists
  if (!jweToken) {
    const error = {
      name: "AuthenticationError",
      message: "No token provided",
      code: grpc.status.UNAUTHENTICATED,
    };
    callback(error, null);
    return { isAuthenticated: false, conn: null };
  }

  // Check if connection exists
  if (conn) {
    // Check if connection is blocked
    if (conn.getStatus() === ConnectionStatus.BLOCKED) {
      const error = {
        name: "AuthenticationError",
        message: "Connection is blocked. Contact administrator.",
        code: grpc.status.UNAUTHENTICATED,
      };
      callback(error, null);
      return { isAuthenticated: false, conn };
    }

    if (conn.getToken() === jweToken) {
      // check for allowed requests and serial number match if token is the same
      if (
        !isRequestAllowed(conn.getCachedTokenPayload(), call.request, callback)
      ) {
        return { isAuthenticated: false, conn };
      }

      if (
        !isSerialNumberMatching(
          conn.getCachedTokenPayload(),
          peerCert,
          callback
        )
      ) {
        conn.handleFailedAuth();
        return { isAuthenticated: false, conn };
      }

      return { isAuthenticated: true, conn };
    }
  } else {
    conn = new Connection(
      jweToken,
      clientAddress,
      ConnectionDirection.RECEIVING
    );
    clientConnections.set(clientAddress, conn);
  }

  // New connection - need to authenticate
  // JWE decryption (RSA-OAEP-256) -> JWS (Plaintext)
  let privateKey: any;
  let jwsToken: string;
  try {
    // Importing RSA private key for decryption
    privateKey = await importPKCS8(
      securityContext.clientPrivateKey.toString("utf-8"),
      "RSA-OAEP-256"
    );

    const { plaintext } = await compactDecrypt(jweToken, privateKey);
    jwsToken = new TextDecoder().decode(plaintext).trim();
  } catch (_e) {
    const error = {
      name: "AuthenticationError",
      message: "Incorrect token provided (JWE Decryption failed)",
      code: grpc.status.UNAUTHENTICATED,
    };
    // TODO: Consider logging or informing a central security system about potential attack/misconfiguration.
    callback(error, null);
    conn.handleFailedAuth();
    return { isAuthenticated: false, conn };
  }

  // Verify JWS (With signature) and payload extraction
  let pub: any;
  let payload: TokenPayload;

  try {
    // Convert a raw Base64 Ed25519 public key to JWK format
    const jwk = {
      kty: "OKP",
      crv: "Ed25519",
      x: Buffer.from(securityContext.JWS_PUBLIC_KEY, "base64").toString(
        "base64url"
      ),
    };

    // Importing the Ed25519 public key for verification - using "EdDSA" algorithm
    pub = await importJWK(jwk, "EdDSA");

    // Compact verify - verify with key and decode the JWS token in one step
    const { payload: jwtPayload, protectedHeader } = await compactVerify(
      jwsToken,
      pub
    );

    // Additional check to ensure correct signing algorithm was used
    if (protectedHeader.alg !== "EdDSA" && protectedHeader.alg !== "Ed25519") {
      const error = {
        name: "AuthenticationError",
        message: "Incorrect signing algorithm for JWS.",
        code: grpc.status.UNAUTHENTICATED,
      };

      callback(error, null);
      return { isAuthenticated: false, conn };
    }

    // Decode and parse the JWT payload
    const payloadString = new TextDecoder().decode(jwtPayload);
    payload = JSON.parse(payloadString);
  } catch (e: any) {
    const error = {
      name: "AuthenticationError",
      message: `JWS Verification error: Invalid signature`,
      code: grpc.status.PERMISSION_DENIED,
    };
    // TODO: Consider logging or informing a central security system about failed verification.
    callback(error, null);

    conn.handleFailedAuth();
    return { isAuthenticated: false, conn };
  }

  // mTLS binding check and authorization
  // Connection tunnel verification with serialNumber (mTLS SN vs Token SN)
  if (!isSerialNumberMatching(payload, peerCert, callback)) {
    conn.handleFailedAuth();
    return { isAuthenticated: false, conn };
  }

  // Validate permission for request method (Authorization check)
  if (!isRequestAllowed(payload, call.request, callback)) {
    return { isAuthenticated: false, conn };
  }

  // Authentication and Authorization successful
  // Update Connection state with SN and status
  conn.handleSuccessfulAuth(payload);
  return { isAuthenticated: true, conn };
};

/**
 * @description Checks if the request method is allowed based on the token permissions.
 * @param tokenPayload payload extracted from the token
 * @param request gRPC request object containing method information
 * @param callback callback to return gRPC error if needed
 * @returns true if request method is allowed, false otherwise
 */
export const isRequestAllowed = (
  tokenPayload: TokenPayload | undefined,
  request: any,
  callback: grpc.sendUnaryData<any>
): Boolean => {
  const method = String(request?.method || "POST").toUpperCase();
  const isValidPayload = validateTokenPayload(tokenPayload, request.method);
  let isUnexpired;

  if (isValidPayload) {
    isUnexpired = isPermissionUnexpired(
      tokenPayload.iat[method],
      tokenPayload.exp[method]
    );
  }

  if (!isValidPayload || !isUnexpired) {
    const error = {
      name: "AuthorizationError",
      code: isUnexpired
        ? grpc.status.PERMISSION_DENIED
        : grpc.status.UNAUTHENTICATED,
      message: isUnexpired
        ? `Request of type ${method} is not allowed by the token policy.`
        : `Request of type ${method}, permission has expired.`,
    } as any;

    callback(error, null);
    return false;
  }

  return true;
};

/**
 * @description Validates the structure and types of the token payload.
 * @returns true if token payload is valid, false otherwise
 */
const validateTokenPayload = (
  tokenPayload: TokenPayload | undefined,
  method: string
): tokenPayload is TokenPayload => {
  if (!tokenPayload) {
    return false;
  }

  if (
    typeof tokenPayload.iat !== "object" ||
    typeof tokenPayload.exp !== "object" ||
    typeof tokenPayload.sub !== "string" ||
    typeof tokenPayload.aud !== "string" ||
    typeof tokenPayload.iss !== "string" ||
    typeof tokenPayload.jti !== "string" ||
    Object.keys(tokenPayload.iat).length === 0 ||
    Object.keys(tokenPayload.exp).length === 0 ||
    !tokenPayload.iat.hasOwnProperty(method) ||
    !tokenPayload.exp.hasOwnProperty(method)
  ) {
    return false;
  }

  return true;
};

/**
 * @description Checks if the permissions granted in the token have expired.
 * @param iat issued-at timestamp for the specific method
 * @param exp expiration timestamp for the specific method
 * @returns true if permission is still valid, false if expired
 */
export const isPermissionUnexpired = (iat: number, exp: number): Boolean => {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  if (nowInSeconds >= exp) {
    return false;
  }

  if (iat > nowInSeconds) {
    return false;
  }

  return true;
};

/**
 * @description Checks if the serial number from the peer certificate matches the one in the token payload.
 * @param tokenPayload payload extracted from the token
 * @param peerCert certificate object retrieved from the gRPC call
 * @param callback callback to return gRPC error if needed
 * @returns true if serial numbers match, false otherwise
 */
export const isSerialNumberMatching = (
  tokenPayload: TokenPayload | undefined,
  peerCert: any,
  callback: grpc.sendUnaryData<any>
): Boolean => {
  const clientSN = normalizeSerial(peerCert?.serialNumber);
  const tokenSN = normalizeSerial(tokenPayload?.sub);

  if (!clientSN || clientSN !== tokenSN) {
    const error = {
      name: "AuthenticationError",
      code: grpc.status.PERMISSION_DENIED,
      message: "Serial number mismatch (mTLS binding failure).",
    } as any;
    callback(error, null);
    return false;
  }
  return true;
};

/**
 * @description Normalizes a certificate serial number by removing colons and converting to uppercase.
 * @param sn serial number string possibly containing colons or being null/undefined
 * @returns normalized serial number string
 */
const normalizeSerial = (sn?: string | null): string => {
  // Node retrieves serial number as hex string, without leading 0x and with possible colons so we need to normalize it
  return (sn || "").replace(/[^0-9a-f]/gi, "").toUpperCase();
};

/**
 * @description Retrieves the peer certificate from the gRPC call object.
 * @param call gRPC call object
 * @returns peer certificate object from the gRPC call
 */
export const getPeerCertFromCall = (call: any) => {
  const session = call?.call?.stream?.session;
  const sock = session?.socket as any;
  return sock?.getPeerCertificate(true); // whole certificate info from TLS socket
};
