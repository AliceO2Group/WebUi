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
import { LogManager } from "@aliceo2/web-ui";
import { DuplexMessageModel } from "./models/message.model.js";
import * as fs from "fs";
import { CentralSystemConfig } from "./models/config.model.js";
import { CentralCommandDispatcher } from "./utils/client/CentralCommandDispatcher.js";
import { Command } from "./models/commands.model.js";

/**
 * @description Central System gRPC wrapper that manages client connections and handles gRPC streams with them.
 */
export class CentralSystemWrapper {
  // utilities
  private logger = LogManager.getLogger("CentralSystemWrapper");
  private dispatcher = new CentralCommandDispatcher();

  // class properties
  private server: grpc.Server;
  private protoPath: string;
  private port: number;

  // certificates paths
  private serverCerts: CentralSystemConfig["serverCerts"];

  // clients management
  private clients = new Map<string, grpc.ServerDuplexStream<any, any>>(); // serialNumber -> stream map
  private clientSerialNumber = new Map<string, string>(); // Peer -> serialNumber map

  /**
   * Initializes the Wrapper for CentralSystem.
   * @param port The port number to bind the gRPC server to.
   */
  constructor(config: CentralSystemConfig) {
    if (
      !config.protoPath ||
      !config.serverCerts ||
      !config.serverCerts.caCertPath ||
      !config.serverCerts.certPath ||
      !config.serverCerts.keyPath
    ) {
      throw new Error("Invalid CentralSystemConfig provided");
    }

    this.protoPath = config.protoPath;
    this.serverCerts = config.serverCerts;
    this.port = config.port || 50051;

    // Register command handlers if provided
    if (config.commandHandlers) {
      config.commandHandlers.forEach(({ command, handler }) => {
        this.dispatcher.register(command, handler);
      });
    }

    this.server = new grpc.Server();
    this.setupService();
  }

  /**
   * @description Loads the gRPC proto definition and sets up the CentralSystem service.
   */
  private setupService(): void {
    // Load the proto definition with options
    const packageDef = protoLoader.loadSync(this.protoPath, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    // Load the package definition into a gRPC object
    const proto = grpc.loadPackageDefinition(packageDef) as any;
    const wrapper = proto.webui.tokenization;

    // Add the CentralSystem service and bind the stream handler
    this.server.addService(wrapper.CentralSystem.service, {
      ClientStream: this.clientStreamHandler.bind(this),
    });
  }

 
  /**
   * @description Handles the duplex stream from the client.
   * @param call The duplex stream call object.
   */
  private clientStreamHandler(call: grpc.ServerDuplexStream<any, any>): void {
    const peer = call.getPeer(); // e.g., ipv4:
    const cert = this.getPeerCertFromCall(call);
    const clientSerialNumber = CentralSystemWrapper.normalizeSerial(
      cert?.serialNumber
    );


    this.logger.infoMessage(
      `Client ${clientSerialNumber} (${peer}) connected to CentralSystem stream`
    );

    // Add client to maps
    this.clients.set(clientSerialNumber, call);
    this.clientSerialNumber.set(peer, clientSerialNumber);

    // Listen for data events from the client
    call.on("data", (data: any) => {
      this.logger.infoMessage(`Received from ${clientSerialNumber}:`, data);
      this.dispatcher.dispatch({
        clientSerialNumber: clientSerialNumber,
        event: data.event,
        payload: data.payload,
      } as Command);
    });

    /**
     * data:
     * {
     *  event: EVENT,
     *  payload: {
     *    targetAddress:...,
     *    token:...
     *  }
     * }
     * 
     * dispatch:
     * {
     *  clientSerialNumber:...,
     *  event: EVENT,
     *  payload: AlertPayload
     * }
     */

    // Handle stream end event
    call.on("end", () => {
      this.logger.infoMessage(`Client ${clientSerialNumber} ended stream.`);
      this.cleanupClient(peer);
      call.end();
    });

    // Handle stream error event
    call.on("error", (err) => {
      this.logger.errorMessage(`Stream error from client ${clientSerialNumber}:`, err);
      this.cleanupClient(peer);
    });
  }

  /**
   * @description Cleans up client resources
   * @param peer Original peer string
   */
  private cleanupClient(peer: string): void {
    const clientIp = this.clientSerialNumber.get(peer);
    if (clientIp) {
      this.clients.delete(clientIp);
      this.clientSerialNumber.delete(peer);
      this.logger.infoMessage(`Cleaned up resources of ${clientIp}`);
    }
  }

  /**
   * @description Sends data to a specific client by serial number address
   * @param clientSerialNumber Client's certificate serial number
   * @param data Data to send
   * @returns Whether the data was successfully sent
   */
  public sendEvent(clientSerialNumber: string, data: DuplexMessageModel): Boolean {
    const client = this.clients.get(clientSerialNumber);
    if (!client) {
      this.logger.warnMessage(`Client ${clientSerialNumber} not found for sending event`);
      return false;
    }

    try {
      client.write(data);
      this.logger.infoMessage(`Sent event to ${clientSerialNumber}:`, data);
      return true;
    } catch (err) {
      this.logger.errorMessage(`Error sending to ${clientSerialNumber}:`, err);
      return false;
    }
  }

  public broadcastEvent(data: DuplexMessageModel): void {
    this.clients.forEach((client, clientSerialNumber) => {
      try {
        client.write(data);
        this.logger.infoMessage(`Broadcasted event to ${clientSerialNumber}:`, data);
      } catch (err) {
        this.logger.errorMessage(`Error broadcasting to ${clientSerialNumber}:`, err);
      }
    });
  }

  /**
   * @description Gets all connected client IPs
   * @returns Array of connected client IPs
   */
  public getConnectedClients(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * @desciprion Starts the gRPC server and binds it to the specified in class port.
   */
  public listen() {
    const addr = `localhost:${this.port}`;

    // create mTLS secure gRPC server
    const caCert = fs.readFileSync(this.serverCerts.caCertPath);
    const centralKey = fs.readFileSync(this.serverCerts.keyPath);
    const centralCert = fs.readFileSync(this.serverCerts.certPath);

    const sslCreds = grpc.ServerCredentials.createSsl(
      caCert,
      [
        {
          private_key: centralKey,
          cert_chain: centralCert,
        },
      ],
      true
    );

    this.server.bindAsync(addr, sslCreds, (err, _port) => {
      if (err) {
        this.logger.errorMessage("Server bind error:", err);
        return;
      }
      this.logger.infoMessage(`CentralSytem started listening on ${addr}`);
    });
  }

  /**
   * @description Retrieves the peer certificate from the gRPC call object.
   * @param call gRPC call object
   * @returns peer certificate object from the gRPC call
   */
  private getPeerCertFromCall(call: any) {
    const session = call?.call?.stream?.session;
    const sock = session?.socket as any;
    return sock?.getPeerCertificate(true); // whole certificate info from TLS socket
  }

  /**
   * @description Normalizes a certificate serial number by removing colons and converting to uppercase.
   * @param sn serial number string possibly containing colons or being null/undefined
   * @returns normalized serial number string
   */
  private static normalizeSerial(sn?: string | null): string {
    // Node retrieves serial number as hex string, without leading 0x and with possible colons so we need to normalize it
    return (sn || "").replace(/[^0-9a-f]/gi, "").toUpperCase();
  }
}
