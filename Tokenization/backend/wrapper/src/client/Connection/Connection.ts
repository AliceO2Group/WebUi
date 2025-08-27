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

import { ConnectionDirection } from "../../models/message.model";
import {
  ConnectionHeaders,
  ConnectionStatus,
  FetchOptions,
  FetchResponse,
} from "../../models/connection.model";
import * as grpc from "@grpc/grpc-js";

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private token: string;
  private status: ConnectionStatus;
  private peerClient?: any; // a client grpc connection instance

  public targetAddress: string;
  public direction: ConnectionDirection;

  /**
   * @description Creates a new Connection instance with the given token, target address, and connection direction.
   *
   * @param token - The authentication token for the connection.
   * @param targetAddress - The unique address of the target client.
   * @param direction - The direction of the connection (e.g., sending or receiving).
   */
  constructor(
    token: string,
    targetAddress: string,
    direction: ConnectionDirection,
    peerCtor: any
  ) {
    this.token = token;
    this.targetAddress = targetAddress;
    this.direction = direction;

    this.peerClient = new peerCtor(
      targetAddress,
      grpc.credentials.createInsecure()
    );

    this.status = ConnectionStatus.CONNECTED;
  }

  /**
   * @description Replace newly generated token
   * @param token New token to be replaced
   */
  public handleNewToken(token: string): void {
    this.token = token;
  }

  /**
   * @description Revoke current token and set status of unauthorized connection
   */
  public handleRevokeToken(): void {
    this.token = "";
    this.status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * @description Returns token for this Connection object
   * @returns Connection token
   */
  public getToken(): string {
    return this.token;
  }

  /**
   * @description Returns status for specific
   * @returns Connection status
   */
  public getStatus(): string {
    return this.status;
  }

  /**
   * @description Updates the status of the connection.
   * @param status New status
   */
  public updateStatus(status: ConnectionStatus): void {
    this.status = status;
  }

  /**
   * @description Returns target address for this Connection object
   * @returns Target address
   */
  public getTargetAddress(): string {
    return this.targetAddress;
  }

  /**
   * @description Attaches gRPC client to that connection
   */
  public attachGrpcClient(client: any): void {
    this.peerClient = client;
  }

  /**
   * @description "HTTP-like" fetch via gRPC protocol
   * @returns Promise with peer's response
   */
  public fetch(options: FetchOptions = {}): Promise<FetchResponse> {
    if (!this.peerClient) {
      return Promise.reject(
        new Error(`Peer client not attached for ${this.getTargetAddress()}`)
      );
    }

    // build a request object
    const method = (options.method || "POST").toUpperCase();
    const path = options.path || "/";
    const headers: ConnectionHeaders = { ...(options.headers || {}) };

    let bodyBuf: Buffer = Buffer.alloc(0);
    const b = options.body;
    if (b != null) {
      if (Buffer.isBuffer(b)) bodyBuf = b;
      else if (b instanceof Uint8Array) bodyBuf = Buffer.from(b);
      else if (typeof b === "string") bodyBuf = Buffer.from(b, "utf8");
      else
        return Promise.reject(
          new Error("Body must be a string/Buffer/Uint8Array")
        );
    }

    const req = { method, path, headers, body: bodyBuf };

    // return promise with response
    return new Promise<FetchResponse>((resolve, reject) => {
      this.peerClient.Fetch(req, (err: any, resp: any) => {
        if (err) return reject(err);

        const resBody = resp?.body ? Buffer.from(resp.body) : Buffer.alloc(0);
        const fetchResponse: FetchResponse = {
          status: Number(resp?.status ?? 200),
          headers: resp?.headers || {},
          body: resBody,
          text: async () => resBody.toString("utf8"),
          json: async () => JSON.parse(resBody.toString("utf8")),
        };

        resolve(fetchResponse);
      });
    });
  }
}
