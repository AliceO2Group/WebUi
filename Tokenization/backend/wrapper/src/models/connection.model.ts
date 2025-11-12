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

export enum ConnectionStatus {
  // The connection is in the process of being established
  CONNECTING = "CONNECTING",
  // The connection has been successfully established
  CONNECTED = "CONNECTED",
  // The connection attempt failed due to authorization issues
  // or token has expired/been revoked
  UNAUTHORIZED = "UNAUTHORIZED",
  // The connection has been closed
  CLOSED = "CLOSED",
  // An error occurred with the connection
  ERROR = "ERROR",
  // The connection is attempting to re-establish after a disruption
  RECONNECTING = "RECONNECTING",
  // The connection is refreshing its authentication token
  TOKEN_REFRESH = "TOKEN_REFRESH",
}
