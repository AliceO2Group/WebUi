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
import { DuplexMessageEvent } from "../../models/message.model";

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
 * - `sendingConnections`: Map of active outbound connections.
 * - `receivingConnections`: Map of active inbound connections.
 */
export class ConnectionManager {
  private logger = LogManager.getLogger("ConnectionManager");
  private centralDispatcher: CentralCommandDispatcher;
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

    this.centralDispatcher = new CentralCommandDispatcher();

    this.centralConnection = new CentralConnection(
      client,
      this.centralDispatcher
    );

    this.sendingConnections.set("a", new Connection("1", "a"));
    this.sendingConnections.set("b", new Connection("2", "b"));
  }

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
   * @description Gets the connection instance by address.
   * @returns{Connection} connection instance.
   */
  getConnectionByAddress(address: string): Connection | undefined {
    return (
      this.sendingConnections.get(address) ||
      this.receivingConnections.get(address)
    );
  }

  public getAllConnections(): {
    sending: Connection[];
    receiving: Connection[];
  } {
    return {
      sending: [...this.sendingConnections.values()],
      receiving: [...this.receivingConnections.values()],
    };
  }
}
