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
import { LogManager } from "@aliceo2/web-ui";
import type { MessageHandler } from "../../models/events.model";

/**
 * @description This class manages the duplex stream with the CentralSystem gRPC service.
 * It is responsible for connecting, reconnecting with backoff, and delegating received messages.
 */
export class CentralConnection {
  private logger = LogManager.getLogger("CentralConnection");
  private stream?: grpc.ClientDuplexStream<any, any>;
  private reconnectAttempts = 0;

  constructor(private client: any, private handler: MessageHandler) {}

  /**
   * @description Initializes the duplex stream and sets up event handlers.
   */
  connect() {
    if (this.stream) return;

    this.stream = this.client.ClientStream();

    this.stream!.on("data", (payload) => {
      this.handler.handle(payload);
    });

    this.stream!.on("end", () => {
      this.logger.infoMessage(`Stream ended, attempting to reconnect...`);
      this.stream = undefined;
      this.scheduleReconnect();
    });

    this.stream!.on("error", (err: any) => {
      this.logger.infoMessage(
        "Stream error:",
        err,
        " attempting to reconnect..."
      );
      this.stream = undefined;
      this.scheduleReconnect();
    });
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
  start() {
    this.connect();
    this.logger.infoMessage(`Connected to CentralSystem`);
  }

  /**
   * @description Disconnects from the gRPC stream and resets attempts.
   */
  disconnect() {
    if (this.stream) {
      this.stream.end();
      this.stream = undefined;
    }
    this.reconnectAttempts = 0;
    this.logger.infoMessage(`Disconnected from CentralSystem`);
  }
}
