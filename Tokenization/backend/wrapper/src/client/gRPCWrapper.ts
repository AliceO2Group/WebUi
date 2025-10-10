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
import { SecurityContext } from "../utils/security/SecurityContext";
import * as fs from "fs";
import { SendAllTokensHandler } from "./Commands/sendAllTokens/sendAllTokens.handler";

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
 * Use grpcWrapper to interact with gRPC services
 * ```
 */
export class gRPCWrapper {
  private ConnectionManager: ConnectionManager;
  private securityContext: SecurityContext;

  /**
   * @description Initializes an instance of gRPCWrapper class.
   *
   * @param config - External configuration object containing necessary paths and addresses.
   */
  constructor(config: gRPCWrapperConfig) {
    if (
      !config.protoPath ||
      !config.centralAddress ||
      !config.clientCerts ||
      !config.clientCerts.caCertPath ||
      !config.clientCerts.certPath ||
      !config.clientCerts.publicKeyPath ||
      !config.clientCerts.privateKeyPath
    ) {
      throw new Error(
        "Invalid gRPCWrapper configuration provided. Missing required paths."
      );
    }

    let clientListenerCert: Buffer = Buffer.alloc(0);

    // Klucze do wysyłania (Sender) są obowiązkowe
    const caCert = fs.readFileSync(config.clientCerts.caCertPath);
    const clientSenderCert = fs.readFileSync(config.clientCerts.certPath);
    const clientPublicKey = fs.readFileSync(config.clientCerts.publicKeyPath);
    const clientPrivateKey = fs.readFileSync(config.clientCerts.privateKeyPath);

    if (config.listenerCertPath) {
      // If we have dedicated listener cert, use it
      clientListenerCert = fs.readFileSync(config.listenerCertPath);
    }

    this.securityContext = new SecurityContext(
      caCert,
      clientSenderCert,
      clientPrivateKey,
      clientPublicKey,
      clientListenerCert
    );

    this.ConnectionManager = new ConnectionManager(
      config.protoPath,
      config.centralAddress,
      this.securityContext
    );

    // Register all command handlers
    this.ConnectionManager.registerCommandHandlers([
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        handler: new RevokeTokenHandler(this.ConnectionManager),
      },
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        handler: new NewTokenHandler(this.ConnectionManager),
      },
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_SEND_ALL_TOKENS,
        handler: new SendAllTokensHandler(this.ConnectionManager),
      },
    ]);
  }

  /**
   * @description Starts the Connection Manager stream connection with Central System
   */
  public connectToCentralSystem() {
    this.ConnectionManager.connectToCentralSystem();
    this.ConnectionManager.getAllTokens();
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
    baseAPIPath?: string
  ): Promise<void> {
    return this.ConnectionManager.listenForPeers(port, baseAPIPath);
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
