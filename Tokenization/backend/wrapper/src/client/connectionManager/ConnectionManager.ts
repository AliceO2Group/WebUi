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

import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { CentralConnection } from './CentralConnection';
import { CentralCommandDispatcher } from './eventManagement/CentralCommandDispatcher';
import { Connection } from '../connection/Connection';
import { LogManager } from '@aliceo2/web-ui';
import type { Command, CommandHandler } from 'models/commands.model';
import type { DuplexMessageEvent } from '../../models/message.model';
import { ConnectionDirection } from '../../models/message.model';
import { ConnectionStatus } from '../../models/connection.model';
import type { SecurityContext } from '../../utils/security/SecurityContext';
import { peerListener } from 'utils/connection/peerListener';

/**
 * @description Manages all the connection between clients and central system.
 */
/**
 * Manages the lifecycle and connection logic for a gRPC client communicating with the central system.
 *
 * This class is responsible for:
 * - Initializing the gRPC client using the provided proto definition and address.
 * - Delegating stream handling to CentralConnection.
 * - Managing sending/receiving connections to other clients.
 *
 * @remarks
 * - `centralConnection`: Handles the duplex stream with the central gRPC server.
 * - `centralDispatcher`: Dispatcher for central system events
 * - `sendingConnections`: Map of active outbound connections.
 * - `receivingConnections`: Map of active inbound connections.
 */
export class ConnectionManager {
  private _logger = LogManager.getLogger('ConnectionManager');
  private _wrapper: any; // GRPC wrapper file

  private _centralDispatcher: CentralCommandDispatcher;
  private _centralConnection: CentralConnection;
  private _sendingConnections = new Map<string, Connection>();

  private _receivingConnections = new Map<string, Connection>();
  private _peerCtor: any; // P2P gRPC constructor
  private _peerServer?: grpc.Server;
  private _baseAPIPath: string = 'localhost:40041/api/';

  /**
   * Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   * @param securityContext - The security context containing certificates and keys for secure communication.
   */
  constructor(protoPath: string, centralAddress: string = 'localhost:50051', private readonly securityContext: SecurityContext) {
    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    this._wrapper = proto.webui.tokenization;
    this._peerCtor = this._wrapper.Peer2Peer;

    // Create grpc credentials
    const sslCreds = grpc.credentials.createSsl(
      this.securityContext.caCert,
      this.securityContext.clientPrivateKey,
      this.securityContext.clientSenderCert
    );
    const centralClient = new this._wrapper.CentralSystem(centralAddress, sslCreds);

    // Event dispatcher for central system events
    this._centralDispatcher = new CentralCommandDispatcher();
    this._centralConnection = new CentralConnection(centralClient, this._centralDispatcher, centralAddress);
  }

  /**
   * Registers new Command Handler for specific central event
   * @param commandHandlers Array of event names and handler instances
   */
  registerCommandHandlers(
    commandHandlers: {
      event: DuplexMessageEvent;
      handler: CommandHandler<Command>;
    }[]
  ): void {
    commandHandlers.forEach(({ event, handler }) => {
      this._centralDispatcher.register(event, handler);
    });
  }

  /**
   * Starts the connection to the central system.
   */
  connectToCentralSystem(): void {
    this._centralConnection.start();
  }

  /**
   * Disconnects from the central system.
   */
  disconnectFromCentralSystem(): void {
    this._centralConnection.disconnect();
  }

  /**
   * Creates new connection
   * @param address Target (external) address of the connection
   * @param direction Direction of connection
   * @param jweToken Optional encrypted JWE token for connection
   */
  public async createNewConnection(address: string, direction: ConnectionDirection, jweToken?: string) {
    let conn: Connection | undefined;

    // Checks if connection already exists
    conn = direction === ConnectionDirection.RECEIVING ? this._receivingConnections.get(address) : this._sendingConnections.get(address);

    // Return existing connection if found
    if (conn) {
      if (jweToken) {
        conn.token = jweToken;
      }
      return conn;
    }

    // Create new connection
    conn = new Connection(jweToken ?? '', address, direction);
    conn.status = ConnectionStatus.CONNECTING;

    if (direction === ConnectionDirection.RECEIVING) {
      this._receivingConnections.set(address, conn);
    } else {
      // Open tunnel only on sending connections
      conn.createSslTunnel(this._peerCtor, {
        caCert: this.securityContext.caCert,
        clientCert: this.securityContext.clientSenderCert,
        clientKey: this.securityContext.clientPrivateKey,
      });
      this._sendingConnections.set(address, conn);
    }
    conn.status = ConnectionStatus.CONNECTED;
    this._logger.infoMessage(`Connection with ${address} has been estabilished. Status: ${conn.status}`);

    return conn;
  }

  /**
   * Gets the connection instance by address.
   * @returns{Connection} connection instance.
   */
  getConnectionByAddress(address: string, direction: ConnectionDirection): Connection | undefined {
    switch (direction) {
      case ConnectionDirection.SENDING:
        return this._sendingConnections.get(address);
      case ConnectionDirection.RECEIVING:
        return this._receivingConnections.get(address);
      default:
        this._logger.errorMessage(`Invalid connection direction: ${direction}`);
        return undefined;
    }
  }

  /**
   * Searches through all receiving and sending connections to find a connection by its client Serial Number (SN).
   * @param serialNumber The unique serial number of the peer's certificate.
   * @returns The matching Connection object or undefined.
   */
  getConnectionBySerialNumber(serialNumber: string): Connection | undefined {
    // Check receiving connections first
    for (const conn of this._receivingConnections.values()) {
      if (conn.serialNumber === serialNumber) {
        return conn;
      }
    }
    // Check sending connections
    for (const conn of this._sendingConnections.values()) {
      if (conn.serialNumber === serialNumber) {
        return conn;
      }
    }
    return undefined;
  }

  /**
   * Returns object with all connections
   * @returns Object of all connections
   */
  public get connections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return {
      sending: [...this._sendingConnections.values()],
      receiving: [...this._receivingConnections.values()],
    };
  }

  /** Starts a listener server for p2p connections */
  public async listenForPeers(port: number, baseAPIPath?: string): Promise<void> {
    if (baseAPIPath) this._baseAPIPath = baseAPIPath;

    if (!this.securityContext.clientListenerCert) {
      this._logger.errorMessage('Listener certificate not provided in gRPCWrapper. Cannot start peer listener.');
      return;
    }

    if (this._peerServer) {
      this._peerServer.forceShutdown();
      this._peerServer = undefined;
    }

    this._peerServer = new grpc.Server();
    this._peerServer.addService(this._wrapper.Peer2Peer.service, {
      Fetch: async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) =>
        peerListener(
          call,
          callback,
          this._logger,
          this._receivingConnections,
          this.createNewConnection.bind(this),
          this.securityContext,
          this._baseAPIPath
        ),
    });

    const sslCreds = grpc.ServerCredentials.createSsl(
      this.securityContext.caCert,
      [
        {
          private_key: this.securityContext.clientPrivateKey,
          cert_chain: this.securityContext.clientListenerCert,
        },
      ],
      true
    );

    await new Promise<void>((resolve, reject) => {
      this._peerServer?.bindAsync(`localhost:${port}`, sslCreds, (err) => (err ? reject(err) : resolve()));
    });

    this._logger.infoMessage(`Peer server listening on localhost:${port}`);
  }
}
