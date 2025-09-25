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
import {
  ConnectionDirection,
  DuplexMessageEvent,
} from "../models/message.model";
import { Connection } from "./Connection/Connection";
import { NewTokenHandler } from "./Commands/newToken/newToken.handler";
import { gRPCWrapperConfig } from "../models/config.model";
import * as fs from "fs";
import { LogManager } from "@aliceo2/web-ui";

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
  private listenerKey?: NonSharedBuffer;
  private listenerCert?: NonSharedBuffer;
  private logger = LogManager.getLogger("gRPCWrapper");

  /**
   * @description Initializes an instance of gRPCWrapper class.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   */
  constructor(config: gRPCWrapperConfig) {
    if (
      !config.protoPath ||
      !config.centralAddress ||
      !config.clientCerts ||
      !config.clientCerts.caCertPath ||
      !config.clientCerts.certPath ||
      !config.clientCerts.keyPath
    ) {
      throw new Error("Invalid gRPCWrapper configuration provided.");
    }

    if (
      config.listenerCertPaths?.keyPath &&
      config.listenerCertPaths?.certPath
    ) {
      this.listenerKey = fs.readFileSync(config.listenerCertPaths.keyPath);
      this.listenerCert = fs.readFileSync(config.listenerCertPaths.certPath);
    }

    this.ConnectionManager = new ConnectionManager(
      config.protoPath,
      config.centralAddress,
      config.clientCerts.caCertPath,
      config.clientCerts.certPath,
      config.clientCerts.keyPath
    );
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
   * @description Starts the Connection Manager stream connection with Central System
   */
  public async connectToClient(
    address: string,
    token?: string
  ): Promise<Connection> {
    return this.ConnectionManager.createNewConnection(
      address,
      ConnectionDirection.SENDING,
      token || ""
    );
  }

  /**
   * @description Starts the Connection Manager stream connection with Central System
   */
  public async listenForPeers(
    port: number,
    baseAPIPath?: string,
    listenerCertPaths?: { keyPath: string; certPath: string }
  ): Promise<void> {
    if (listenerCertPaths?.keyPath && listenerCertPaths?.certPath) {
      this.listenerKey = fs.readFileSync(listenerCertPaths.keyPath);
      this.listenerCert = fs.readFileSync(listenerCertPaths.certPath);
    }

    if (!this.listenerKey || !this.listenerCert) {
      this.logger.errorMessage(
        "Listener certificates are required to start P2P listener. Please provide valid paths."
      );
      return;
    }

    return this.ConnectionManager.listenForPeers(
      port,
      this.listenerKey,
      this.listenerCert,
      baseAPIPath
    );
  }

  /**
   * @description Returns all saved connections.
   *
   * @returns An object containing the sending and receiving connections.
   */
  public getAllConnections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return this.ConnectionManager.getAllConnections();
  }

  /**
   * @returns Returns string with summary of all connection
   */
  public getSummary(): string {
    const conn = this.ConnectionManager.getAllConnections();
    return (
      `Wrapper Summary: ` +
      `\nSending Connections: ${conn.sending.length}` +
      `\nReceiving Connections: ${conn.receiving.length}` +
      conn.sending
        .map(
          (c) =>
            `\n- ${c.getTargetAddress()} \nDirection - ${
              c.direction
            }\n\tStatus: (${c.getStatus()})\n\tToken: (${c.getToken()})`
        )
        .join("") +
      conn.receiving
        .map(
          (c) =>
            `\n- ${c.getTargetAddress()} \nDirection - ${
              c.direction
            }\n\tStatus: (${c.getStatus()})\n\tToken: (${c.getToken()})`
        )
        .join("")
    );
  }
}
