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

// IMPORTANT: This key must be securely provided to the interceptor.
const RAW_ED25519_B64_KEY = "VqkcxlpJYVZI/SxgWH/VqVNeKhMGIbUfHn0okzdGs2E=";

/**
 * @description gRPC interceptor function responsible for JWE decryption, JWS verification,
 * certificate serial number matching (mTLS binding), and basic authorization.
 */
export const gRPCAuthInterceptor = async (
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
  clientConnections: Map<string, Connection>,
  privateKeyBuffer: NonSharedBuffer // RSA Private Key (PKCS8) for JWE decryption
): Promise<{ isAuthenticated: Boolean; conn: Connection | null }> => {
  const metadata = call.metadata.getMap();
  const jweToken = metadata.jweToken as string;
  const clientAddress = call.getPeer();
  let conn = clientConnections.get(clientAddress);

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
          (call as any).getPeerCertificate(),
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
      privateKeyBuffer.toString("utf-8"),
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
      x: Buffer.from(RAW_ED25519_B64_KEY, "base64").toString("base64url"),
    };

    // Importing the Ed25519 public key for verification - using "EdDSA" algorithm
    pub = await importJWK(jwk, "EdDSA");

    // Compact verify - verify with key and decode the JWS token in one step
    const { payload: jwtPayload, protectedHeader } = await compactVerify(
      jwsToken,
      pub
    );

    // Optional: Additional check to ensure correct signing algorithm was used
    // if (protectedHeader.alg !== "EdDSA" && protectedHeader.alg !== "Ed25519") {
    //   throw new Error("JWS signed with an unexpected algorithm.");
    // }

    // Decode and parse the JWT payload
    const payloadString = new TextDecoder().decode(jwtPayload);
    payload = JSON.parse(payloadString);
  } catch (e: any) {
    const isExpired = e.message?.includes("expired");
    const error = {
      name: "AuthenticationError",
      message: `JWS Verification error: ${
        isExpired ? "Token expired" : "Invalid signature"
      }`,
      code: isExpired
        ? grpc.status.UNAUTHENTICATED
        : grpc.status.PERMISSION_DENIED,
    };
    // TODO: Consider logging or informing a central security system about failed verification.
    callback(error, null);

    if (!isExpired) {
      conn.handleFailedAuth();
    }

    return { isAuthenticated: false, conn };
  }

  // mTLS binding check and authorization
  // Connection tunnel verification with serialNumber (mTLS SN vs Token SN)
  if (
    !isSerialNumberMatching(
      payload,
      (call as any).getPeerCertificate(),
      callback
    )
  ) {
    conn.handleFailedAuth();
    return { isAuthenticated: false, conn };
  }

  // Validate permission for request method (Authorization check)
  if (!isRequestAllowed(payload, call.request, callback)) {
    return { isAuthenticated: false, conn };
  }

  // Authentication and Authorization successful
  // Update Connection state with SN and status
  conn.handleSuccessfulAuth(payload as any);
  return { isAuthenticated: true, conn };
};

const isRequestAllowed = (
  tokenPayload: TokenPayload | undefined,
  request: any,
  callback: grpc.sendUnaryData<any>
): Boolean => {
  const method = String(request?.method || "POST").toUpperCase();
  if (
    !tokenPayload?.allowedRequests ||
    !tokenPayload.allowedRequests.includes(method as any)
  ) {
    const error = {
      name: "AuthorizationError",
      code: grpc.status.PERMISSION_DENIED,
      message: `Request of type ${method} is not allowed by the token policy.`,
    } as any;

    callback(error, null);
    return false;
  }

  return true;
};

const isSerialNumberMatching = (
  tokenPayload: TokenPayload | undefined,
  peerCert: any,
  callback: grpc.sendUnaryData<any>
): Boolean => {
  const clientSerialNumber = peerCert ? peerCert.serialNumber : null;
  const tokenSerialNumber = tokenPayload?.serialNumber; // Serial number is inside the signed payload

  if (!clientSerialNumber || tokenSerialNumber !== clientSerialNumber) {
    // Critical security failure!!!: The token holder does not match the mTLS certificate holder.
    const error = {
      name: "AuthenticationError",
      code: grpc.status.PERMISSION_DENIED,
      message: "Serial number mismatch (mTLS binding failure).",
    } as any;
    // TODO: This should trigger a high-priority security alert.
    callback(error, null);
    return false;
  }

  return true;
};
