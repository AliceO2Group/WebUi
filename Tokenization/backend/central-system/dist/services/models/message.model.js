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
export var DuplexMessageEvent;
(function (DuplexMessageEvent) {
    DuplexMessageEvent["MESSAGE_EVENT_EMPTY"] = "MESSAGE_EVENT_EMPTY";
    DuplexMessageEvent["MESSAGE_EVENT_NEW_TOKEN"] = "MESSAGE_EVENT_NEW_TOKEN";
    DuplexMessageEvent["MESSAGE_EVENT_REVOKE_TOKEN"] = "MESSAGE_EVENT_REVOKE_TOKEN";
})(DuplexMessageEvent || (DuplexMessageEvent = {}));
/**
 * @enum Represents the direction of a connection in the system.
 * @property SENDING: Indicates a connection where messages are sent to another client.
 * @property RECEIVING: Indicates a connection where messages are received from another client.
 * @property DUPLEX: Indicates a connection that can both send and receive messages.
 */
export var ConnectionDirection;
(function (ConnectionDirection) {
    ConnectionDirection["SENDING"] = "SENDING";
    ConnectionDirection["RECEIVING"] = "RECEIVING";
    ConnectionDirection["DUPLEX"] = "DUPLEX";
})(ConnectionDirection || (ConnectionDirection = {}));
