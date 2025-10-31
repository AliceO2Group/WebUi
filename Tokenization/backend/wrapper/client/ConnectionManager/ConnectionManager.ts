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
import { EventDispatcher } from "../ConnectionManager/EventManagement/EventDispatcher";
import { Connection } from "../Connection/Connection";
import { LogManager } from "@aliceo2/web-ui";

/**
 * - Managing a duplex stream (`stream`) for bidirectional communication.
 * - Handling automatic reconnection with exponential backoff on stream errors or disconnects.
 * - Providing methods to start (`connectToCentralSystem`) and stop (`disconnect`) the connection with central system.
 *
 * @remarks
 * - `client`: The gRPC client instance for communicating with the central system.
 * - `stream`: The active duplex stream for sending and receiving messages (optional).
 * - `address`: The address of the central gRPC server.
 * - `reconnectAttempts`: The number of consecutive reconnection attempts made after a disconnect or error.
 */
export class ConnectionManager {
  // utilities
  private logger = LogManager.getLogger("ConnectionManager");

  // class properties
  private client: any;
  private stream?: grpc.ClientDuplexStream<any, any>;
  private readonly address: string;
  private reconnectAttempts = 0;

  private centralConnection: CentralConnection;
  private sendingConnections = new Map<string, Connection>();
  private receivingConnections = new Map<string, Connection>();

  /**
   * @description Initializes a new instance of the ConnectionManager class.
   *
   * This constructor sets up the gRPC client for communication with the central system.
   *
   * @param protoPath - The file path to the gRPC proto definition.
   * @param centralAddress - The address of the central gRPC server (default: "localhost:50051").
   */
  constructor(protoPath: string, centralAddress: string = "localhost:50051") {
    const packageDef = protoLoader.loadSync(protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.webui.tokenization;

    const client = new wrapper.CentralSystem(
      centralAddress,
      grpc.credentials.createInsecure()
    );

    const dispatcher = new EventDispatcher();
    this.centralConnection = new CentralConnection(client, dispatcher);

    this.sendingConnections.set("a", new Connection("1", "a"));
    this.sendingConnections.set("b", new Connection("2", "b"));
    // Create gRPC client
    this.client = new wrapper.CentralSystem(
      this.address,
      grpc.credentials.createInsecure()
    );
  }

  /**
   * @description Initializes the duplex stream and sets up handlers.
   */
  private connect() {
    if (this.stream) return;
    this.stream = this.client.ClientStream();

    if (this.stream) {
      this.stream.on("data", (payload) => {
        // handle data received from the stream
      });

      this.stream.on("end", () => {
        this.logger.infoMessage(`Stream ended, attempting to reconnect...`);
        this.stream = undefined;
        this.scheduleReconnect();
      });

      this.stream.on("error", (err: any) => {
        this.logger.infoMessage(
          `Stream error:`,
          err,
          " attempting to reconnect..."
        );
        this.stream = undefined;
        this.scheduleReconnect();
      });
    }
  }

  /**
   * @description Schedules a reconnect with exponential backoff.
   */
  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    setTimeout(() => {
      this.logger.infoMessage(
        `Reconnecting (attempt ${this.reconnectAttempts})...`
      );
      this.connect();
    }, delay);
  }

  /**
   * @description Starts the connection to the central system.
   */
  connectToCentralSystem() {
    this.centralConnection.start();
  }

  /**
   * @description Disconnects from the central system.
   */
  disconnectFromCentralSystem() {
    this.centralConnection.disconnect();
  }
}
