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
import { DuplexMessageModel } from "../models/message.model";
import * as fs from "fs";
import { CentralSystemConfig } from "models/config.model";

/**
 * @description Central System gRPC wrapper that manages client connections and handles gRPC streams with them.
 */
export class CentralSystemWrapper {
  // utilities
  private logger = LogManager.getLogger("CentralSystemWrapper");

  // class properties
  private server: grpc.Server;
  private protoPath: string;
  private port: number;

  // certificates paths
  private serverCerts: CentralSystemConfig["serverCerts"];

  // clients management
  private clients = new Map<string, grpc.ServerDuplexStream<any, any>>();
  private clientIps = new Map<string, string>(); // Peer -> IP map

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
   * @description Extracts IP address from peer string
   * @param peer string e.g. ipv4:127.0.0.1:12345
   * @returns Extracted IP address
   */
  private extractIpFromPeer(peer: string): string {
    // Context
    // IPv4 format: "ipv4:127.0.0.1:12345"
    // IPv6 format: "ipv6:[::1]:12345"

    const ipv4Match = peer.match(/^ipv4:(.+?):\d+$/);
    if (ipv4Match) return ipv4Match[1];

    const ipv6Match = peer.match(/^ipv6:\[(.+?)\]:\d+$/);
    if (ipv6Match) return ipv6Match[1];

    // fallback to original peer if pattern doesn't match any
    return peer;
  }

  /**
   * @description Handles the duplex stream from the client.
   * @param call The duplex stream call object.
   */
  private clientStreamHandler(call: grpc.ServerDuplexStream<any, any>): void {
    const peer = call.getPeer();
    const clientIp = this.extractIpFromPeer(peer);

    this.logger.infoMessage(
      `Client ${clientIp} (${peer}) connected to CentralSystem stream`
    );

    // Add client to maps
    this.clients.set(clientIp, call);
    this.clientIps.set(peer, clientIp);

    // Listen for data events from the client
    call.on("data", (payload: any) => {
      this.logger.infoMessage(`Received from ${clientIp}:`, payload);
    });

    // Handle stream end event
    call.on("end", () => {
      this.logger.infoMessage(`Client ${clientIp} ended stream.`);
      this.cleanupClient(peer);
      call.end();
    });

    // Handle stream error event
    call.on("error", (err) => {
      this.logger.errorMessage(`Stream error from client ${clientIp}:`, err);
      this.cleanupClient(peer);
    });
  }

  /**
   * @description Cleans up client resources
   * @param peer Original peer string
   */
  private cleanupClient(peer: string): void {
    const clientIp = this.clientIps.get(peer);
    if (clientIp) {
      this.clients.delete(clientIp);
      this.clientIps.delete(peer);
      this.logger.infoMessage(`Cleaned up resources of ${clientIp}`);
    }
  }

  /**
   * @description Sends data to a specific client by IP address
   * @param ip Client IP address
   * @param data Data to send
   * @returns Whether the data was successfully sent
   */
  public sendEvent(ip: string, data: DuplexMessageModel): boolean {
    const client = this.clients.get(ip);
    if (!client) {
      this.logger.warnMessage(`Client ${ip} not found for sending event`);
      return false;
    }

    try {
      client.write(data);
      this.logger.infoMessage(`Sent event to ${ip}:`, data);
      return true;
    } catch (err) {
      this.logger.errorMessage(`Error sending to ${ip}:`, err);
      return false;
    }
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
}
