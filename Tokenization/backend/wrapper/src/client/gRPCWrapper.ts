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

import { ConnectionManager } from "./ConnectionManager/ConnectionManager";
import { RevokeTokenHandler } from "./Commands/revokeToken/revokeToken.handler";
import { DuplexMessageEvent } from "../models/message.model";
import { Connection } from "./Connection/Connection";
import { NewTokenHandler } from "./Commands/newToken/newToken.handler";

/**
 * @description Wrapper class for managing secure gRPC wrapper.
 *
 * @remarks
 * This class serves as a high-level abstraction over the underlying
 * `ConnectionManager`, providing a simplified interface for establishing
 * and managing gRPC connections within the application.
 *
 * @example
 * ```typescript
 * const grpcWrapper = new gRPCWrapper(PROTO_PATH, CENTRAL_SYSTEM_ADDRESS);
 * // Use grpcWrapper to interact with gRPC services
 * ```
 */
export class gRPCWrapper {
  private ConnectionManager: ConnectionManager;

  /**
   * @description Initializes an instance of gRPCWrapper class.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:4100").
   */
  constructor(protoPath: string, centralAddress: string = "localhost:4100") {
    this.ConnectionManager = new ConnectionManager(protoPath, centralAddress);
    this.ConnectionManager.registerCommandHandlers([
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        handler: new RevokeTokenHandler(this.ConnectionManager),
      },
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        handler: new NewTokenHandler(this.ConnectionManager),
      },
    ]);
  }

  /**
   * @description Starts the Connection Manager stream connection with Central System
   */
  public connectToCentralSystem() {
    this.ConnectionManager.connectToCentralSystem();
  }

  /**
   * @description Returns all saved connections.
   *
   * @returns An object containing the sending and receiving connections.
   */
  public get connections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return this.ConnectionManager.connections;
  }

  public getSummary(): string {
    const conn = this.ConnectionManager.connections;
    return (
      `Wrapper Summary: ` +
      `\nSending Connections: ${conn.sending.length}` +
      `\nReceiving Connections: ${conn.receiving.length}` +
      conn.sending
        .map((c) => `\n- ${c.targetAddress} - ${c.direction}\n\t(${c.status})`)
        .join("") +
      conn.receiving
        .map((c) => `\n- ${c.targetAddress} - ${c.direction}\n\t(${c.status})`)
        .join("")
    );
  }
}
