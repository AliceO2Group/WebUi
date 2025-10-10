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

import { AlertPayload } from "./alert.model";
import { SingleTokenPayload, TokenListPayload } from "./token.model";

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
 * @property MESSAGE_EVENT_SEND_ALERT: Event for sending an alert to the central system.
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
  MESSAGE_EVENT_SEND_ALERT = "MESSAGE_EVENT_SEND_ALERT",
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

// ======================================
//              INTERFACES
// ======================================

export type PayloadVariant =
  | TokenListPayload
  | SingleTokenPayload
  | AlertPayload;

/**
 * @description Model for duplex stream messages between client and central system.
 * @property {DuplexMessageEvent} event - The event type of the message.
 * @property {PayloadVariant} payload - The data associated with the event, it may be undefined for some events.
 * @example
 * {
 *  event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
 *  payload: { singleToken: {token: 'abc', targetAddress: 'localhost:50051'} }
 * }
 */
export interface DuplexMessageModel {
  event: DuplexMessageEvent;
  payload?: PayloadVariant;
}
