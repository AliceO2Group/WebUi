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
import { Connection } from "client/Connection/Connection";
import { importPKCS8, importJWK, compactDecrypt, compactVerify } from "jose";

interface TokenPayload {
  serialNumber: string;
  allowedRequests: ("POST" | "GET" | "PUT" | "DELETE" | "PATCH")[];
}

export const gRPCAuthInterceptor = async (
  call: grpc.ServerUnaryCall<any, any>,
  callback: grpc.sendUnaryData<any>,
  clientConnections: Map<string, Connection>,
  privateKeyBuffer: NonSharedBuffer,
  publicKeyBuffer: NonSharedBuffer
): Promise<Boolean> => {
  const metadata = call.metadata.getMap();
  const jweToken = metadata.token as string;

  // check if token exists
  if (!jweToken) {
    const error = {
      name: "AuthenticationError",
      message: "No token provided",
      code: grpc.status.UNAUTHENTICATED,
    };

    callback(error, null);
    return false;
  }

  // validate JWE (encrypted JWS) - decode JWE -> JWS
  let privateKey: any;
  let jwsToken: any;
  try {
    privateKey = await importPKCS8(
      privateKeyBuffer.toString("utf-8"),
      "RSA-OAEP-256"
    );
    const { plaintext } = await compactDecrypt(jweToken, privateKey); // decrypt JWE token
    jwsToken = plaintext.toString();
  } catch (_e) {
    const error = {
      name: "AuthenticationError",
      message: "Incorrect token provided",
      code: grpc.status.UNAUTHENTICATED,
    };

    // TODO?: inform central system about incorrect token coming for peer
    // or create counter with incorrect tries and then inform central system
    // it potentially might be an attack here.

    callback(error, null);
    return false;
  }

  // check if connection is blocked
  const conn = clientConnections.get();

  // validate JWS signature
  let publicKey: any;
  let payload: TokenPayload;
  try {
    publicKey = await importJWK(JSON.parse(publicKeyBuffer.toString()));
    const { payload: jwtPayload } = await compactVerify(jwsToken, publicKey);

    const payloadString = new TextDecoder().decode(jwtPayload);
    payload = JSON.parse(payloadString);
  } catch (e: any) {
    const error = {
      name: "AuthenticationError",
      message: `JWS ${
        e.message.includes("expired") ? "Expiration" : "Verification"
      } error`,
      code: e.message.includes("expired")
        ? grpc.status.UNAUTHENTICATED
        : grpc.status.PERMISSION_DENIED,
    };

    // TODO?: inform central system about incorrect token coming for peer
    // or create counter with incorrect tries and then inform central system
    // it potentially might be an attack here.

    callback(error, null);
    return false;
  }

  // Connection tunnel verification with SN
  const peerCert = (call as any).getPeerCertificate(); // its not publicly exposed
  const clientSerialNumber = peerCert ? peerCert.serialNumber : null;
  const tokenSerialNumber = payload.serialNumber; // Serial number is inside payload

  if (!clientSerialNumber || tokenSerialNumber !== clientSerialNumber) {
    const error = {
      name: "AuthenticationError",
      code: grpc.status.PERMISSION_DENIED,
      message: "Serial number mismatch.",
    } as any;

    // TODO?: inform central system about incorrect token coming for peer
    // or create counter with incorrect tries and then inform central system
    // it potentially might be an attack here.

    callback(error, null);
    return false;
  }

  // Validate permission for request method
  const method = String(call.request?.method || "POST").toUpperCase();
  if (!payload.allowedRequests.includes(method as any)) {
    const error = {
      name: "AuthorizationError",
      code: grpc.status.PERMISSION_DENIED,
      message: `Request of type ${method} is not allowed.`,
    } as any;

    // TODO?: inform central system about incorrect token coming for peer
    // or create counter with incorrect tries and then inform central system
    // it potentially might be an attack here.

    callback(error, null);
    return false;
  }

  return true;
};
