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
import { LogManager } from '@aliceo2/web-ui';
import * as fs from 'fs';
import type { CentralSystemConfig } from '../models/config.model';
import type { DuplexMessageModel } from '../models/message.model';

/**
 * @description Central System gRPC wrapper that manages client connections and handles gRPC streams with them.
 */
export class CentralSystemWrapper {
  // Config
  private _protoPath: string;

  // Class properties
  private _server: grpc.Server;
  private _port: number;

  // Certificates paths
  private _serverCerts: CentralSystemConfig['serverCerts'];

  // Utilities
  private _logger = LogManager.getLogger('CentralSystemWrapper');

  // Clients management
  private _clients = new Map<string, grpc.ServerDuplexStream<any, any>>();
  private _clientIps = new Map<string, string>(); // Peer -> IP map

  /**
   * Initializes the Wrapper for CentralSystem.
   * @param port The port number to bind the gRPC server to.
   */
  constructor(config: CentralSystemConfig) {
    if (!config.protoPath || !config.serverCerts?.caCertPath || !config.serverCerts?.certPath || !config.serverCerts?.keyPath) {
      throw new Error('Invalid CentralSystemConfig provided');
    }

    this._protoPath = config.protoPath;
    this._serverCerts = config.serverCerts;
    this._port = config.port ?? 50051;

    this._server = new grpc.Server();
    this.setupService();
  }

  /**
   * Loads the gRPC proto definition and sets up the CentralSystem service.
   */
  private setupService(): void {
    // Load the proto definition with options
    const packageDef = protoLoader.loadSync(this._protoPath, {
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
    this._server.addService(wrapper.CentralSystem.service, {
      ClientStream: this.clientStreamHandler.bind(this),
    });
  }

  /**
   * Extracts IP address from peer string
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

    // Fallback to original peer if pattern doesn't match any
    return peer;
  }

  /**
   * Handles the duplex stream from the client.
   * @param call The duplex stream call object.
   */
  private clientStreamHandler(call: grpc.ServerDuplexStream<any, any>): void {
    const peer = call.getPeer();
    const clientIp = this.extractIpFromPeer(peer);

    this._logger.infoMessage(`Client ${clientIp} (${peer}) connected to CentralSystem stream`);

    // Add client to maps
    this._clients.set(clientIp, call);
    this._clientIps.set(peer, clientIp);

    // Listen for data events from the client
    call.on('data', (payload: any) => {
      this._logger.infoMessage(`Received from ${clientIp}:`, payload);
    });

    // Handle stream end event
    call.on('end', () => {
      this._logger.infoMessage(`Client ${clientIp} ended stream.`);
      this.cleanupClient(peer);
      call.end();
    });

    // Handle stream error event
    call.on('error', (err) => {
      this._logger.errorMessage(`Stream error from client ${clientIp}:`, err);
      this.cleanupClient(peer);
    });
  }

  /**
   * Cleans up client resources
   * @param peer Original peer string
   */
  private cleanupClient(peer: string): void {
    const clientIp = this._clientIps.get(peer);
    if (clientIp) {
      this._clients.delete(clientIp);
      this._clientIps.delete(peer);
      this._logger.infoMessage(`Cleaned up resources of ${clientIp}`);
    }
  }

  /**
   * Sends data to a specific client by IP address
   * @param ip Client IP address
   * @param data Data to send
   * @returns Whether the data was successfully sent
   */
  public sendEvent(ip: string, data: DuplexMessageModel): boolean {
    const client = this._clients.get(ip);
    if (!client) {
      this._logger.warnMessage(`Client ${ip} not found for sending event`);
      return false;
    }

    try {
      client.write(data);
      this._logger.infoMessage(`Sent event to ${ip}:`, data);
      return true;
    } catch (err) {
      this._logger.errorMessage(`Error sending to ${ip}:`, err);
      return false;
    }
  }

  public broadcastEvent(data: DuplexMessageModel): void {
    this.clients.forEach((client, ip) => {
      try {
        client.write(data);
        this.logger.infoMessage(`Broadcasted event to ${ip}:`, data);
      } catch (err) {
        this.logger.errorMessage(`Error broadcasting to ${ip}:`, err);
      }
    });
  }

  /**
   * Gets all connected client IPs
   * @returns Array of connected client IPs
   */
  public get connectedClients(): string[] {
    return Array.from(this._clients.keys());
  }

  /**
   * Starts the gRPC server and binds it to the specified in class port.
   */
  public listen() {
    const addr = `localhost:${this._port}`;

    // Create mTLS secure gRPC server
    const caCert = fs.readFileSync(this._serverCerts.caCertPath);
    const centralKey = fs.readFileSync(this._serverCerts.keyPath);
    const centralCert = fs.readFileSync(this._serverCerts.certPath);

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

    this._server.bindAsync(addr, sslCreds, (err, _port) => {
      if (err) {
        this._logger.errorMessage('Server bind error:', err);
        return;
      }
      this._logger.infoMessage(`CentralSytem started listening on ${addr}`);
    });
  }
}
