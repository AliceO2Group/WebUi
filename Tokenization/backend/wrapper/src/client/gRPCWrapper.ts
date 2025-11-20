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

import { ConnectionManager } from './ConnectionManager/ConnectionManager';
import { RevokeTokenHandler } from './commands/revokeToken/revokeToken.handler';
import { ConnectionDirection, DuplexMessageEvent } from '../models/message.model';
import { Connection } from './connection/Connection';
import { NewTokenHandler } from './commands/newToken/newToken.handler';
import { gRPCWrapperConfig } from '../models/config.model';
import * as fs from 'fs';
import { LogManager } from '@aliceo2/web-ui';

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
  private _connectionManager: ConnectionManager;
  private _listenerKey?: NonSharedBuffer;
  private _listenerCert?: NonSharedBuffer;
  private _logger = LogManager.getLogger('gRPCWrapper');

  /**
   * Initializes an instance of gRPCWrapper class.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:4100").
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
      throw new Error('Invalid gRPCWrapper configuration provided.');
    }

    if (config.listenerCertPaths?.keyPath && config.listenerCertPaths?.certPath) {
      this._listenerKey = fs.readFileSync(config.listenerCertPaths.keyPath);
      this._listenerCert = fs.readFileSync(config.listenerCertPaths.certPath);
    }

    this._connectionManager = new ConnectionManager(
      config.protoPath,
      config.centralAddress,
      config.clientCerts.caCertPath,
      config.clientCerts.certPath,
      config.clientCerts.keyPath
    );
    this._connectionManager.registerCommandHandlers([
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        handler: new RevokeTokenHandler(this._connectionManager),
      },
      {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        handler: new NewTokenHandler(this._connectionManager),
      },
    ]);
  }

  /**
   * Connects to the central system using the underlying ConnectionManager.
   *
   * @remarks
   * This method starts the duplex stream connection with the central gRPC server.
   */
  public connectToCentralSystem() {
    this._connectionManager.connectToCentralSystem();
  }

  /**
   * Establishes a new connection to a target client.
   *
   * @param address - The target address of the client.
   * @param token - Optional authentication token for the connection.
   *
   * @returns A promise that resolves to the newly created connection ready to use for fetching data.
   */
  public async connectToClient(address: string, token?: string): Promise<Connection> {
    return this._connectionManager.createNewConnection(address, ConnectionDirection.SENDING, token ?? '');
  }

  /**
   * Starts a listener server for p2p connections.
   * @param port The port number to bind the p2p server to.
   * @param baseAPIPath Optional base API path to forward requests to e.g. '/api'.
   * @returns A promise that resolves when the p2p listener server is started.
   */
  public async listenForPeers(port: number, baseAPIPath?: string, listenerCertPaths?: { keyPath: string; certPath: string }): Promise<void> {
    if (listenerCertPaths?.keyPath && listenerCertPaths?.certPath) {
      this._listenerKey = fs.readFileSync(listenerCertPaths.keyPath);
      this._listenerCert = fs.readFileSync(listenerCertPaths.certPath);
    }

    if (!this._listenerKey || !this._listenerCert) {
      this._logger.errorMessage('Listener certificates are required to start P2P listener. Please provide valid paths.');
      return;
    }

    return this._connectionManager.listenForPeers(port, this._listenerKey, this._listenerCert, baseAPIPath);
  }

  /**
   * Returns all saved connections.
   *
   * @returns An object containing the sending and receiving connections.
   */
  public get connections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return this._connectionManager.connections;
  }

  /**
   * Returns a summary of the connections managed by the ConnectionManager.
   * The summary includes the number of sending and receiving connections, as well as the target address, direction, and status of each connection.
   *
   * @returns A string summary of the connections.
   */
  public getSummary(): string {
    const conn = this._connectionManager.connections;
    return (
      `Wrapper Summary: ` +
      `\nSending Connections: ${conn.sending.length}` +
      `\nReceiving Connections: ${conn.receiving.length}${conn.sending
        .map((c) => `\n- ${c.targetAddress} - ${c.direction}\n\t(${c.status})`)
        .join('')}${conn.receiving.map((c) => `\n- ${c.targetAddress} - ${c.direction}\n\t(${c.status})`).join('')}`
    );
  }
}
