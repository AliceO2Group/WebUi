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

import { TokenAuthReason } from "./token.model";

// ======================================
//                 ENUMS
// ======================================

export enum AlertLevel {
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

/**
 * Enumeration of alert codes used throughout the application to represent
 * various authentication and peer-to-peer (P2P) forwarding errors.
 *
 * @remarks
 * These codes are typically used for error handling, logging, and user notifications.
 *
 * @enum {string}
 * @property {string} AUTH_NO_TOKEN - Indicates that no authentication token was provided.
 * @property {string} AUTH_JWE_DECRYPT_FAIL - Indicates failure to decrypt a JWE (JSON Web Encryption) token.
 * @property {string} AUTH_JWS_INVALID - Indicates that the JWS (JSON Web Signature) token is invalid.
 * @property {string} AUTH_SN_MISMATCH - Indicates a mismatch in the serial number during authentication.
 * @property {string} AUTH_METHOD_FORBIDDEN - Indicates that the authentication method is forbidden.
 * @property {string} AUTH_PERMISSION_EXPIRED - Indicates that the user's permission has expired.
 * @property {string} AUTH_CONN_BLOCKED - Indicates that the connection is blocked due to authentication issues.
 * @property {string} P2P_FORWARD_ERROR - Indicates an error occurred during P2P forwarding.
 */
export enum AlertCode {
  AUTH_NO_TOKEN = "AUTH_NO_TOKEN",
  AUTH_JWE_DECRYPT_FAIL = "AUTH_JWE_DECRYPT_FAIL",
  AUTH_JWS_INVALID = "AUTH_JWS_INVALID",
  AUTH_SN_MISMATCH = "AUTH_SN_MISMATCH",
  AUTH_METHOD_FORBIDDEN = "AUTH_METHOD_FORBIDDEN",
  AUTH_PERMISSION_EXPIRED = "AUTH_PERMISSION_EXPIRED",
  AUTH_CONN_BLOCKED = "AUTH_CONN_BLOCKED",
  P2P_FORWARD_ERROR = "P2P_FORWARD_ERROR",
}

// ======================================
//              INTERFACES
// ======================================

export interface AlertPayload {
  alert: string;
  level: AlertLevel;
  code: AlertCode;
  ts: number;
  context: AlertContext;
}

/**
 * Partial context for alerts.
 *
 * @property peer the peer's address (e.g. hostname, IP address)
 * @property err the error message (if applicable)
 * @property alg the algorithm used (if applicable)
 * @property peerSN the peer's certificate serial number (if applicable)
 * @property token the token itself (if applicable)
 * @property tokenSN the serial number bound to the token (if applicable)
 * @property method the method that triggered the alert (if applicable)
 * @property exp the expiration timestamp of the permission (if applicable)
 * @property ms the timestamp of the event (if applicable)
 * @property url the URL of the request (if applicable)
 * @property status the status code of the request (if applicable)
 * @property addr the address of the request (if applicable)
 * @property iat the issued-at timestamp of the permission (if applicable)
 * @property now the timestamp of the current moment (if applicable)
 */
export type AlertContext = Partial<{
  peer: string;
  err: string;
  alg: string;
  peerSN: string;
  token: string;
  tokenSN: string;
  method: string;
  exp: number | string;
  ms: number;
  url: string;
  status: number | string;
  addr: string;
}>;

// ======================================
//           CODE -> LEVEL MAP
// ======================================

export const AlertCodeLevel: Record<AlertCode, AlertLevel> = {
  [AlertCode.AUTH_NO_TOKEN]: AlertLevel.ERROR,
  [AlertCode.AUTH_JWE_DECRYPT_FAIL]: AlertLevel.ERROR,
  [AlertCode.AUTH_JWS_INVALID]: AlertLevel.ERROR,
  [AlertCode.AUTH_SN_MISMATCH]: AlertLevel.CRITICAL,
  [AlertCode.AUTH_METHOD_FORBIDDEN]: AlertLevel.ERROR,
  [AlertCode.AUTH_PERMISSION_EXPIRED]: AlertLevel.WARNING,
  [AlertCode.AUTH_CONN_BLOCKED]: AlertLevel.CRITICAL,
  [AlertCode.P2P_FORWARD_ERROR]: AlertLevel.ERROR,
};

// ======================================
//       HELPERS FOR ALERT CONTENT
// ======================================

/**
 * Returns a fallback string if the given value is undefined, null, or empty string.
 * Otherwise, returns the value as a string.
 * @param v the value to be checked
 * @param fallback the fallback string to return if v is undefined/null/empty string
 * @returns the value as a string, or the fallback string if applicable
 */
const def = (v: any, fallback = "n/a") =>
  v === undefined || v === null || v === "" ? fallback : String(v);

export const AlertTemplates: Record<AlertCode, (c?: AlertContext) => string> = {
  [AlertCode.AUTH_NO_TOKEN]: (c) => `No token provided (peer=${def(c?.peer)})`,

  [AlertCode.AUTH_JWE_DECRYPT_FAIL]: (c) =>
    `JWE decryption failed: ${def(c?.err)}`,

  [AlertCode.AUTH_JWS_INVALID]: (c) =>
    `JWS verification failed: ${def(c?.err)}${c?.alg ? `, alg=${c.alg}` : ""}`,

  [AlertCode.AUTH_SN_MISMATCH]: (c) =>
    `Serial mismatch: peerSN=${def(c?.peerSN)}, tokenSN=${def(c?.tokenSN)}`,

  [AlertCode.AUTH_METHOD_FORBIDDEN]: (c) =>
    `Method ${def(c?.method)} not allowed by token policy`,

  [AlertCode.AUTH_PERMISSION_EXPIRED]: (c) =>
    `Permission for ${def(c?.method)} expired at ${def(c?.exp)}`,

  [AlertCode.AUTH_CONN_BLOCKED]: (c) =>
    `Connection blocked (peer=${def(c?.peer)})`,

  [AlertCode.P2P_FORWARD_ERROR]: (c) =>
    `Forwarding to ${def(c?.url)} failed: status=${def(c?.status)}, err=${def(
      c?.err
    )}`,
};

// ======================================
//              GENERATOR
// ======================================

/**
 * Generates an AlertPayload object based on the given AlertCode and context.
 * @param code the AlertCode to generate the alert for
 * @param ctx the context object containing additional information for the alert
 * @returns an AlertPayload object containing the generated alert message, level, code,
 * timestamp, and context
 */
export function makeAlert(
  code: AlertCode,
  ctx: AlertContext = {}
): AlertPayload {
  const level = AlertCodeLevel[code];
  const template = AlertTemplates[code] ?? (() => `Event: ${code}`);
  const message = `[${code}] ${template(ctx)}`;
  return { alert: message, level, code, ts: Date.now(), context: ctx };
}
/**
 * Maps a TokenAuthReason to an AlertCode.
 * @param reason the reason for the token validation failure
 * @returns the corresponding AlertCode
 */
export function codeFromTokenReason(reason: TokenAuthReason): AlertCode {
  switch (reason) {
    case TokenAuthReason.NO_TOKEN:
      return AlertCode.AUTH_NO_TOKEN;
    case TokenAuthReason.CONNECTION_BLOCKED:
      return AlertCode.AUTH_CONN_BLOCKED;
    case TokenAuthReason.JWE_DECRYPT_FAIL:
      return AlertCode.AUTH_JWE_DECRYPT_FAIL;
    case TokenAuthReason.JWS_INVALID:
      return AlertCode.AUTH_JWS_INVALID;
    case TokenAuthReason.SERIAL_MISMATCH:
      return AlertCode.AUTH_SN_MISMATCH;
    case TokenAuthReason.PERMISSION_FORBIDDEN:
      return AlertCode.AUTH_METHOD_FORBIDDEN;
    case TokenAuthReason.PERMISSION_EXPIRED:
      return AlertCode.AUTH_PERMISSION_EXPIRED;
    default:
      // unknown error
      return AlertCode.P2P_FORWARD_ERROR;
  }
}
