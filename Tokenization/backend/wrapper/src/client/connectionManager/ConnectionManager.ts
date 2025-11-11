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
  private _centralDispatcher: CentralCommandDispatcher;
  private _centralConnection: CentralConnection;
  private _sendingConnections = new Map<string, Connection>();
  private _receivingConnections = new Map<string, Connection>();
  private _wrapper: any;
  private _peerCtor: any;
  private _peerServer: grpc.Server | undefined;
  private _baseAPIPath: string = '';

  /**
   * Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   */
  constructor(protoPath: string, centralAddress: string = 'localhost:50051') {
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

    const client = new this._wrapper.CentralSystem(centralAddress, grpc.credentials.createInsecure());

    // Event dispatcher for central system events
    this._centralDispatcher = new CentralCommandDispatcher();
    this._centralConnection = new CentralConnection(client, this._centralDispatcher, centralAddress);
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
   * @param token Optional token for connection
   */
  createNewConnection(address: string, direction: ConnectionDirection, token?: string) {
    const conn = new Connection(token ?? '', address, direction);

    if (direction === ConnectionDirection.RECEIVING) {
      this._receivingConnections.set(address, conn);
    } else {
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
   * Returns all saved connections.
   *
   * @returns An object containing the sending and receiving connections.
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

    if (this._peerServer) {
      this._peerServer.forceShutdown();
      this._peerServer = undefined;
    }

    this._peerServer = new grpc.Server();
    this._peerServer.addService(this._wrapper.Peer2Peer.service, {
      Fetch: async (call: grpc.ServerUnaryCall<any, any>, callback: grpc.sendUnaryData<any>) => {
        try {
          const clientAddress = call.getPeer();
          this._logger.infoMessage(`Incoming request from ${clientAddress}`);

          let conn: Connection | undefined = this._receivingConnections.get(clientAddress);

          if (!conn) {
            conn = new Connection('', clientAddress, ConnectionDirection.RECEIVING, this._peerCtor);
            conn.status = ConnectionStatus.CONNECTED;
            this._receivingConnections.set(clientAddress, conn);
            this._logger.infoMessage(`New incoming connection registered for: ${clientAddress}`);
          }

          // Create request to forward to local API endpoint
          const method = String(call.request?.method ?? 'POST').toUpperCase();
          const url = this._baseAPIPath + (call.request?.path ?? '');
          const headers: { [key: string]: string } = call.request?.headers;
          const body = call.request?.body ? Buffer.from(call.request.body).toString('utf-8') : undefined;

          this._logger.infoMessage(`Received payload from ${clientAddress}: \n${url}\n${JSON.stringify(headers)}\n${JSON.stringify(body)}\n`);

          const httpResp = await fetch(url, {
            method,
            headers: headers,
            body,
          });

          const respHeaders: Record<string, string> = {};
          httpResp.headers.forEach((v, k) => (respHeaders[k] = v));
          const resBody = Buffer.from(await httpResp.arrayBuffer());

          callback(null, {
            status: httpResp.status,
            headers: respHeaders,
            body: resBody,
          });
        } catch (e: any) {
          this._logger.errorMessage(`Error forwarding request: ${e ?? 'Uknown error'}`);

          callback({
            code: grpc.status.INTERNAL,
            message: e?.message ?? 'forward error',
          } as any);
        }
      },
    });

    await new Promise<void>((resolve, reject) => {
      this._peerServer?.bindAsync(`localhost:${port}`, grpc.ServerCredentials.createInsecure(), (err) => (err ? reject(err) : resolve()));
    });

    this._logger.infoMessage(`Peer server listening on localhost:${port}`);
  }
}
