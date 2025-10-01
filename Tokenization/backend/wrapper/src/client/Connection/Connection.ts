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
  TokenPayload,
} from "../../models/connection.model";
import * as grpc from "@grpc/grpc-js";
import { LogManager } from "@aliceo2/web-ui";

type ConnectionCerts = {
  caCert: Buffer;
  clientCert: Buffer;
  clientKey: Buffer;
};

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private jweToken: string;
  private status: ConnectionStatus;
  private peerClient?: any; // a client grpc connection instance

  // security management variables
  private clientSerialNumber?: string; // The certificate SN used to uniquely identify the peer.
  private lastActiveTimestamp: number; // Timestamp of the last successful request (for garbage collection).
  private authFailures: number; // Counter for consecutive authentication failures (for anti-DDoS/throttling).
  private cachedTokenPayload?: TokenPayload; // Cache of the successfully verified token payload.

  public targetAddress: string;
  public direction: ConnectionDirection;

  // utils
  private logger;

  /**
   * @description Creates a new Connection instance with the given token, target address, and connection direction.
   *
   * @param jweToken - The encrypted JWE token for the connection.
   * @param targetAddress - The unique address of the target client.
   * @param direction - The direction of the connection (e.g., sending or receiving).
   * @param clientSN - Optional serial number of the peer's certificate (used for lookups).
   */
  constructor(
    jweToken: string,
    targetAddress: string,
    direction: ConnectionDirection,
    clientSN?: string
  ) {
    this.jweToken = jweToken;
    this.targetAddress = targetAddress;
    this.direction = direction;

    // Initialize state fields
    this.clientSerialNumber = clientSN;
    this.lastActiveTimestamp = Date.now();
    this.authFailures = 0;
    this.status = ConnectionStatus.CONNECTED;

    this.logger = LogManager.getLogger(`Connection ${targetAddress}`);
  }

  /**
   * @description Creates the mTLS gRPC client and attaches it to the connection.
   * This method is REQUIRED ONLY for outbound (SENDING) connections.
   * * @param peerCtor - The constructor for the gRPC client to be used for communication.
   * @param connectionCerts - Required sending client certificates for mTLS.
   */
  public createSslTunnel(
    peerCtor: any,
    connectionCerts: ConnectionCerts
  ): void {
    if (this.direction !== ConnectionDirection.SENDING) {
      this.logger.warnMessage(
        "Attempted to create SSL tunnel on a RECEIVING connection. This is usually unnecessary."
      );
    }

    if (
      !connectionCerts.caCert ||
      !connectionCerts.clientCert ||
      !connectionCerts.clientKey
    ) {
      throw new Error(
        "Connection certificates are required to create an mTLS tunnel."
      );
    }

    // create grpc credentials
    const sslCreds = grpc.credentials.createSsl(
      connectionCerts.caCert,
      connectionCerts.clientKey,
      connectionCerts.clientCert
    );

    this.peerClient = new peerCtor(this.targetAddress, sslCreds);
    this.updateStatus(ConnectionStatus.CONNECTED);
  }

  /**
   * @description Replace newly generated token
   * @param jweToken New token to be replaced
   */
  public handleNewToken(jweToken: string): void {
    this.jweToken = jweToken;
  }

  /**
   * @description Revoke current token and set status of unauthorized connection
   */
  public handleRevokeToken(): void {
    this.jweToken = "";
    this.status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * @description Handles a successful authentication event. Updates the active timestamp,
   * resets the failure counter, and caches the new token payload.
   * This is crucial for high-performance applications to avoid re-validating the same token.
   * @param payload The decoded and verified token payload.
   */
  public handleSuccessfulAuth(payload: TokenPayload): void {
    this.lastActiveTimestamp = Date.now();
    this.authFailures = 0;
    this.cachedTokenPayload = payload;
    this.updateStatus(ConnectionStatus.CONNECTED);
  }

  /**
   * @description Handles an authentication failure. Increments the failure counter.
   * If the failure count exceeds a local threshold, the connection is locally marked as BLOCKED.
   * @returns The new count of consecutive failures.
   */
  public handleFailedAuth(): number {
    this.authFailures += 1;

    // Local throttling mechanism
    if (this.authFailures >= 5) {
      this.updateStatus(ConnectionStatus.BLOCKED);
    }
    return this.authFailures;
  }

  /**
   * @description Returns token for this Connection object
   * @returns Connection token
   */
  public getToken(): string {
    return this.jweToken;
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
   * @description Returns the client's Serial Number (SN).
   * @returns The client's serial number or undefined.
   */
  public getSerialNumber(): string | undefined {
    return this.clientSerialNumber;
  }

  /**
   * @description Sets the client's Serial Number. Primarily used for RECEIVING connections
   * where the SN is extracted during the first mTLS handshake in the interceptor.
   * @param serialNumber The serial number string.
   */
  public setSerialNumber(serialNumber: string): void {
    this.clientSerialNumber = serialNumber;
  }

  /**
   * @description Returns the timestamp of the last successful interaction.
   * @returns UNIX timestamp in milliseconds.
   */
  public getLastActiveTimestamp(): number {
    return this.lastActiveTimestamp;
  }

  /**
   * @description Returns the cached token payload.
   * @returns The cached payload or undefined.
   */
  public getCachedTokenPayload(): TokenPayload | undefined {
    return this.cachedTokenPayload;
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

    // set mandatory grpc metadata
    const metadata = new grpc.Metadata();
    metadata.set("jwetoken", this.jweToken);

    // build body buffer
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
      this.peerClient.Fetch(req, metadata, (err: any, resp: any) => {
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
