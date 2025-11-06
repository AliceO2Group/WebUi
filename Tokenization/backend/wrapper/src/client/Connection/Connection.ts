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

import { ConnectionDirection } from "../../models/message.model";
import { ConnectionStatus } from "../../models/connection.model";

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private _token: string;
  private _targetAddress: string;
  private _status: ConnectionStatus;

  /**
   * @description Creates a new Connection instance with the given token, target address, and connection direction.
   *
   * @param token - The authentication token for the connection.
   * @param targetAddress - The unique address of the target client.
   * @param direction - The direction of the connection (e.g., sending or receiving).
   */
  constructor(
    token: string,
    targetAddress: string,
    public direction: ConnectionDirection
  ) {
    this._token = token;
    this._targetAddress = targetAddress;

    this._status = ConnectionStatus.CONNECTED;
  }

  /**
   * @description Replace newly generated token
   * @param token New token to be replaced
   */
  public set token(token: string) {
    this._token = token;
  }

  public handleRevokeToken(): void {
    this._token = "";
    this._status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * @description Returns token for this Connection object
   * @returns Connection token
   */
  public get token(): string {
    return this._token;
  }

  /**
   * @description Returns status for specific
   * @returns Connection status
   */
  public get status(): string {
    return this._status;
  }

  /**
   * @description Returns target address for this Connection object
   * @returns Target address
   */
  public get targetAddress(): string {
    return this._targetAddress;
  }
}
