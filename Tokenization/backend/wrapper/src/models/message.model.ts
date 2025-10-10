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

// ======================================
//                 ENUMS
// ======================================

/**
 * @enum Represents the types of events that can occur in a duplex message exchange.
 * @property MESSAGE_EVENT_EMPTY: No event, used for initialization or no response.
 * @property MESSAGE_EVENT_NEW_TOKEN: Event for replacing with newly generated token.
 * @property MESSAGE_EVENT_REVOKE_TOKEN: Event for revoking an existing token.
 * @property MESSAGE_EVENT_GET_ALL_TOKENS: Event for getting all tokens for this client.
 * @property MESSAGE_EVENT_RENEW_TOKEN: Event for renewing a token after expiration.
 */
export enum DuplexMessageEvent {
  // Central system commands
  MESSAGE_EVENT_EMPTY = "MESSAGE_EVENT_EMPTY",
  MESSAGE_EVENT_NEW_TOKEN = "MESSAGE_EVENT_NEW_TOKEN",
  MESSAGE_EVENT_REVOKE_TOKEN = "MESSAGE_EVENT_REVOKE_TOKEN",
  MESSAGE_EVENT_SEND_ALL_TOKENS = "MESSAGE_EVENT_SEND_ALL_TOKENS",

  // Client commands
  MESSAGE_EVENT_GET_ALL_TOKENS = "MESSAGE_EVENT_GET_LAST_TOKEN",
  MESSAGE_EVENT_RENEW_TOKEN = "MESSAGE_EVENT_RENEW_TOKEN",
}

/**
 * @enum Represents the direction of a connection in the system.
 * @property SENDING: Indicates a connection where messages are sent to another client.
 * @property RECEIVING: Indicates a connection where messages are received from another client.
 * @property DUPLEX: Indicates a connection that can both send and receive messages.
 */
export enum ConnectionDirection {
  SENDING = "SENDING",
  RECEIVING = "RECEIVING",
  DUPLEX = "DUPLEX",
}

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

export type TokenPayloadVariant = TokenListPayload | SingleTokenPayload;

/**
 * @description Model for duplex stream messages between client and central system.
 * @property {DuplexMessageEvent} event - The event type of the message.
 * @property {TokenPayloadVariant} payload - The data associated with the event, it may be undefined for some events.
 * @example
 * {
 *  event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
 *  payload: { singleToken: {token: 'abc', targetAddress: 'localhost:50051'} }
 * }
 */
export interface DuplexMessageModel {
  event: DuplexMessageEvent;
  payload?: TokenPayloadVariant;
}
