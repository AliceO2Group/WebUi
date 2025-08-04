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
 */
export enum DuplexMessageEvent {
  MESSAGE_EVENT_EMPTY = 0,
  MESSAGE_EVENT_NEW_TOKEN = 1,
  MESSAGE_EVENT_REVOKE_TOKEN = 2,
}

// ======================================
//              INTERFACES
// ======================================

/**
 * @description Model for token generation and revocation messages.
 * @property {string} token - The token to be replaced or revoked.
 * @property {string} targetAddress - The address of connection binded to this token.
 */
export interface TokenMessage {
  token?: string;
  targetAddress: string;
}

/**
 * @description Model for duplex stream messages between client and central system.
 * @property {DuplexMessageEvent} event - The event type of the message.
 * @property {TokenMessage} data - The data associated with the event, it may be undefined for some events.
 * @example {event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN, data: {token: '', targetAddress: ''}}
 */
export interface DuplexMessageModel {
  event: DuplexMessageEvent;
  data: {
    newToken?: TokenMessage;
    revokeToken?: TokenMessage;
  };
}
