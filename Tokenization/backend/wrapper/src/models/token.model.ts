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

import { ConnectionDirection } from "./message.model";

// ======================================
//                 ENUMS
// ======================================

/**
 * @remarks This enum is used to indicate specific causes when token-based authentication does not succeed.
 *
 * @enum
 * @property NO_TOKEN - No authentication token was provided.
 * @property CONNECTION_BLOCKED - The connection was blocked, possibly due to security policies.
 * @property JWE_DECRYPT_FAIL - Failed to decrypt the JWE (JSON Web Encryption) token.
 * @property JWS_INVALID - The JWS (JSON Web Signature) token is invalid.
 * @property SERIAL_MISMATCH - The token's serial number does not match the expected value.
 * @property PERMISSION_EXPIRED - The permissions associated with the token have expired.
 * @property PERMISSION_FORBIDDEN - The token does not have the required permissions.
 */
export enum TokenAuthReason {
  NO_TOKEN = "NO_TOKEN",
  CONNECTION_BLOCKED = "CONNECTION_BLOCKED",
  JWE_DECRYPT_FAIL = "JWE_DECRYPT_FAIL",
  JWS_INVALID = "JWS_INVALID",
  SERIAL_MISMATCH = "SERIAL_MISMATCH",
  PERMISSION_EXPIRED = "PERMISSION_EXPIRED",
  PERMISSION_FORBIDDEN = "PERMISSION_FORBIDDEN",
}

// Header names for token messages
export const TOKEN_REASON_HEADER = "x-token-reason"; // TokenAuthReason from enum
export const TOKEN_TARGET_HEADER = "x-token-target"; // address/peer

// ======================================
//              INTERFACES
// ======================================

/**
 * @description Model for token generation and revocation messages.
 * @property {string} token - The token to be replaced or revoked.
 * @property {ConnectionDirection} connectionDirection - The direction of the connection associated with this token.
 * @property {string} targetAddress - The address of connection binded to this token.
 */
export interface TokenMessage {
  token?: string;
  connectionDirection?: ConnectionDirection;
  targetAddress: string;
}

export interface TokenListPayload {
  tokensList: TokenMessage[];
}

export interface SingleTokenPayload {
  singleToken: TokenMessage;
}

/**
 * @description Payload structure for authentication tokens
 * @sub {string} sub - Subject: Client's certificate serial number
 * @aud {string} aud - Audience: Listener's certificate serial number
 * @iss {string} iss - Issuer: Central system's certificate serial number
 * @iat {Object} iat - Issued At: Permissions granted to the client (e.g., allowed HTTP methods with timestamps)
 * @exp {number} exp - Expiration: Expiry timestamps for the granted permissions
 * @jti {string} jti - JWT ID: Unique identifier for the token
 */
export type TokenPayload = {
  sub: string;
  aud: string;
  iss: string;
  iat: { [method: string]: number };
  exp: { [method: string]: number };
  jti: string;
};
