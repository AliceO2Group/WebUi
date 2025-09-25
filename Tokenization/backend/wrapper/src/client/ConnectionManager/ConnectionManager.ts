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

import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import { CentralConnection } from "./CentralConnection";
import { CentralCommandDispatcher } from "./EventManagement/CentralCommandDispatcher";
import { Connection } from "../Connection/Connection";
import { LogManager } from "@aliceo2/web-ui";
import { Command, CommandHandler } from "models/commands.model";
import {
  ConnectionDirection,
  DuplexMessageEvent,
} from "../../models/message.model";
import { ConnectionStatus } from "../../models/connection.model";
import * as fs from "fs";

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
  private logger = LogManager.getLogger("ConnectionManager");
  private wrapper: any; // gRPC wrapper file

  private centralDispatcher: CentralCommandDispatcher;
  private centralConnection: CentralConnection;
  private sendingConnections = new Map<string, Connection>();

  private receivingConnections = new Map<string, Connection>();
  private peerCtor: any; // p2p gRPC constructor
  private peerServer?: grpc.Server;
  private baseAPIPath: string = "localhost:40041/api/";

  // client certificates
  private caCert: NonSharedBuffer;
  private clientCert: NonSharedBuffer;
  private clientKey: NonSharedBuffer;

  /**
   * @description Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   * @param caCertPath - Path to the CA certificate file.
   * @param clientCertPath - Path to the client certificate file.
   * @param clientKeyPath - Path to the client key file.
   */
  constructor(
    protoPath: string,
    centralAddress: string = "localhost:50051",
    caCertPath: string,
    clientCertPath: string,
    clientKeyPath: string
  ) {
    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    this.wrapper = proto.webui.tokenization;
    this.peerCtor = this.wrapper.Peer2Peer;

    // read certs
    this.caCert = fs.readFileSync(caCertPath);
    this.clientCert = fs.readFileSync(clientCertPath);
    this.clientKey = fs.readFileSync(clientKeyPath);

    // create grpc credentials
    const sslCreds = grpc.credentials.createSsl(
      this.caCert,
      this.clientKey,
      this.clientCert
    );
    const centralClient = new this.wrapper.CentralSystem(
      centralAddress,
      sslCreds
    );

    // event dispatcher for central system events
    this.centralDispatcher = new CentralCommandDispatcher();
    this.centralConnection = new CentralConnection(
      centralClient,
      this.centralDispatcher
    );

    this.sendingConnections.set(
      "a",
      new Connection("1", "a", ConnectionDirection.SENDING, this.peerCtor, {
        caCert: this.caCert,
        clientCert: this.clientCert,
        clientKey: this.clientKey,
      })
    );
    this.sendingConnections.set(
      "b",
      new Connection("2", "b", ConnectionDirection.SENDING, this.peerCtor, {
        caCert: this.caCert,
        clientCert: this.clientCert,
        clientKey: this.clientKey,
      })
    );
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
      this.centralDispatcher.register(event, handler);
    });
  }

  /**
   * @description Starts the connection to the central system.
   */
  connectToCentralSystem(): void {
    this.centralConnection.start();
  }

  /**
   * @description Disconnects from the central system.
   */
  disconnectFromCentralSystem(): void {
    this.centralConnection.disconnect();
  }

  /**
   * Creates new connection
   * @param address Target (external) address of the connection
   * @param direction Direction of connection
   * @param token Optional token for connection
   */
  public async createNewConnection(
    address: string,
    direction: ConnectionDirection,
    token?: string
  ) {
    let conn: Connection | undefined;

    // Checks if connection already exists
    conn =
      direction === ConnectionDirection.RECEIVING
        ? this.receivingConnections.get(address)
        : this.sendingConnections.get(address);

    // Return existing connection if found
    if (conn) {
      if (token) {
        conn.handleNewToken(token);
      }
      return conn;
    }

    // Create new connection
    conn = new Connection(token || "", address, direction, this.peerCtor, {
      caCert: this.caCert,
      clientCert: this.clientCert,
      clientKey: this.clientKey,
    });
    conn.updateStatus(ConnectionStatus.CONNECTING);

    if (direction === ConnectionDirection.RECEIVING) {
      this.receivingConnections.set(address, conn);
    } else {
      this.sendingConnections.set(address, conn);
    }
    conn.updateStatus(ConnectionStatus.CONNECTED);
    this.logger.infoMessage(
      `Connection with ${address} has been estabilished. Status: ${conn.getStatus()}`
    );

    return conn;
  }

  /**
   * @description Gets the connection instance by address.
   * @returns{Connection} connection instance.
   */
  getConnectionByAddress(
    address: string,
    direction: ConnectionDirection
  ): Connection | undefined {
    switch (direction) {
      case ConnectionDirection.SENDING:
        return this.sendingConnections.get(address);
      case ConnectionDirection.RECEIVING:
        return this.receivingConnections.get(address);
      default:
        this.logger.errorMessage(`Invalid connection direction: ${direction}`);
        return undefined;
    }
  }

  /**
   * Returns object with all connections
   * @returns Object of all connections
   */
  public getAllConnections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return {
      sending: [...this.sendingConnections.values()],
      receiving: [...this.receivingConnections.values()],
    };
  }

  /** Starts a listener server for p2p connections */
  public async listenForPeers(
    port: number,
    listenerKey: NonSharedBuffer,
    listenerCert: NonSharedBuffer,
    baseAPIPath?: string
  ): Promise<void> {
    if (baseAPIPath) this.baseAPIPath = baseAPIPath;

    if (this.peerServer) {
      this.peerServer.forceShutdown();
      this.peerServer = undefined;
    }

    this.peerServer = new grpc.Server();
    this.peerServer.addService(this.wrapper.Peer2Peer.service, {
      Fetch: async (
        call: grpc.ServerUnaryCall<any, any>,
        callback: grpc.sendUnaryData<any>
      ) => {
        try {
          const clientAddress = call.getPeer();
          this.logger.infoMessage(`Incoming request from ${clientAddress}`);

          let conn: Connection | undefined =
            this.receivingConnections.get(clientAddress);

          if (!conn) {
            conn = new Connection(
              "",
              clientAddress,
              ConnectionDirection.RECEIVING,
              this.peerCtor,
              {
                caCert: this.caCert,
                clientCert: this.clientCert,
                clientKey: this.clientKey,
              }
            );
            conn.updateStatus(ConnectionStatus.CONNECTED);
            this.receivingConnections.set(clientAddress, conn);
            this.logger.infoMessage(
              `New incoming connection registered for: ${clientAddress}`
            );
          }

          // create request to forward to local API endpoint
          const method = String(call.request?.method || "POST").toUpperCase();
          const url = this.baseAPIPath + (call.request?.path || "");
          const headers: { [key: string]: string } = call.request?.headers;
          const body = call.request?.body
            ? Buffer.from(call.request.body).toString("utf-8")
            : undefined;

          this.logger.infoMessage(
            `Received payload from ${clientAddress}: \n${url}\n${JSON.stringify(
              headers
            )}\n${JSON.stringify(body)}\n`
          );

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
          this.logger.errorMessage(
            `Error forwarding request: ${e ?? "Uknown error"}`
          );

          callback({
            code: grpc.status.INTERNAL,
            message: e?.message ?? "forward error",
          } as any);
        }
      },
    });

    const sslCreds = grpc.ServerCredentials.createSsl(
      this.caCert,
      [
        {
          private_key: listenerKey,
          cert_chain: listenerCert,
        },
      ],
      true
    );

    await new Promise<void>((resolve, reject) => {
      this.peerServer!.bindAsync(`localhost:${port}`, sslCreds, (err) =>
        err ? reject(err) : resolve()
      );
    });

    this.logger.infoMessage(`Peer server listening on localhost:${port}`);
  }
}
