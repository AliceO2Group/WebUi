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
import { Command, CommandHandler } from "../../models/commands.model";
import {
  ConnectionDirection,
  DuplexMessageEvent,
} from "../../models/message.model";
import { ConnectionStatus } from "../../models/connection.model";
import { GRPCAuthInterceptor } from "./Interceptors/grpc.auth.interceptor";
import { SecurityContext } from "../../utils/security/SecurityContext";
import { AlertPayload } from "../../models/alert.model";

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

  /**
   * @description Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   * @param securityContext - The security context containing certificates and keys for secure communication.
   */
  constructor(
    protoPath: string,
    centralAddress: string = "localhost:50051",
    private readonly securityContext: SecurityContext,
    private gRPCAuthInterceptor = new GRPCAuthInterceptor(this, securityContext)
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

    // create grpc credentials
    const sslCreds = grpc.credentials.createSsl(
      this.securityContext.caCert,
      this.securityContext.clientPrivateKey,
      this.securityContext.clientSenderCert
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
   * @param jweToken Optional encrypted JWE token for connection
   */
  public async createNewConnection(
    address: string,
    direction: ConnectionDirection,
    jweToken?: string
  ) {
    let conn: Connection | undefined;

    // Checks if connection already exists
    conn =
      direction === ConnectionDirection.RECEIVING
        ? this.receivingConnections.get(address)
        : this.sendingConnections.get(address);

    // Return existing connection if found
    if (conn) {
      if (jweToken) {
        conn.handleNewToken(jweToken);
      }
      return conn;
    }

    // Create new connection
    conn = new Connection(
      jweToken || "",
      address,
      direction,
      this.renewToken.bind(this)
    );
    conn.updateStatus(ConnectionStatus.CONNECTING);

    if (direction === ConnectionDirection.RECEIVING) {
      this.receivingConnections.set(address, conn);
    } else {
      // open tunnel only on sending connections
      conn.createSslTunnel(this.peerCtor, {
        caCert: this.securityContext.caCert,
        clientCert: this.securityContext.clientSenderCert,
        clientKey: this.securityContext.clientPrivateKey,
      });
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
   * @description Retrieves a connection instance by its token.
   * @param {string} token - The token to search for.
   * @returns {Connection | undefined} The connection instance with the matching token, or undefined if not found.
   */
  getConnectionByToken(token: string): Connection | undefined {
    for (const conn of this.sendingConnections.values()) {
      if (conn.getToken() === token) {
        return conn;
      }
    }
    for (const conn of this.receivingConnections.values()) {
      if (conn.getToken() === token) {
        return conn;
      }
    }
    return undefined;
  }

  /**
   * @description Searches through all receiving and sending connections to find a connection by its client Serial Number (SN).
   * @param serialNumber The unique serial number of the peer's certificate.
   * @returns The matching Connection object or undefined.
   */
  getConnectionBySerialNumber(serialNumber: string): Connection | undefined {
    // Check receiving connections first
    for (const conn of this.receivingConnections.values()) {
      if (conn.getSerialNumber() === serialNumber) {
        return conn;
      }
    }
    // Check sending connections
    for (const conn of this.sendingConnections.values()) {
      if (conn.getSerialNumber() === serialNumber) {
        return conn;
      }
    }
    return undefined;
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
    baseAPIPath?: string
  ): Promise<void> {
    if (baseAPIPath) this.baseAPIPath = baseAPIPath;

    if (!this.securityContext.clientListenerCert) {
      this.logger.errorMessage(
        "Listener certificate not provided in gRPCWrapper. Cannot start peer listener."
      );
      return;
    }

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
        // run auth interceptor
        const { isAuthenticated, conn } =
          await this.gRPCAuthInterceptor.validate(call, callback);

        if (!isAuthenticated || !conn) {
          // Authentication failed - response already sent in interceptor
          return;
        }

        try {
          const clientAddress = call.getPeer();
          this.logger.infoMessage(`Incoming request from ${clientAddress}`);

          conn.updateStatus(ConnectionStatus.CONNECTED);
          this.receivingConnections.set(clientAddress, conn);

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
      this.peerServer!.bindAsync(`localhost:${port}`, sslCreds, (err) =>
        err ? reject(err) : resolve()
      );
    });

    this.logger.infoMessage(`Peer server listening on localhost:${port}`);
  }

  /**
   * @description Sends command to central system to get all tokens
   * @returns Promise<void> - central system will send asynchronously MESSAGE_EVENT_SEND_ALL_TOKENS with TokenListPayload interface
   */
  public getAllTokens(): void {
    this.centralConnection.sendEvent({
      event: DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS,
    });
  }

  /**
   * @description Sends command to central system to renew token for a specific target connection
   * @param expiredToken token that needs to be renew
   * @param targetAddress target address we want to send to
   * @returns Promise<void> - central system will send asynchronously MESSAGE_EVENT_NEW_TOKEN with SingleTokenPayload interface
   */
  private renewToken(expiredToken: string, targetAddress: string): void {
    const conn = this.sendingConnections.get(targetAddress);
    if (!conn) {
      return;
    }

    this.centralConnection.sendEvent({
      event: DuplexMessageEvent.MESSAGE_EVENT_RENEW_TOKEN,
      payload: {
        singleToken: {
          token: expiredToken,
          targetAddress: targetAddress,
        },
      },
    });
  }

  /**
   * @description Sends alert to the central system.
   * @param alert AlertPayload containing alert code, level, code, and timestamp.
   * @returns void
   */
  public sendCentralAlert(alert: AlertPayload): void {
    this.centralConnection.sendEvent({
      event: DuplexMessageEvent.MESSAGE_EVENT_SEND_ALERT,
      payload: {
        ...alert,
      },
    });
  }
}
