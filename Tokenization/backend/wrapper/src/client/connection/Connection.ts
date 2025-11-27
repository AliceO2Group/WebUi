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

import type { ConnectionDirection } from '../../models/message.model';
import type { ConnectionHeaders, FetchOptions, FetchResponse } from '../../models/connection.model';
import { ConnectionStatus } from '../../models/connection.model';
import * as grpc from '@grpc/grpc-js';

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private _token: string;
  private _targetAddress: string;
  private _status: ConnectionStatus;
  private _peerClient: any;
  public direction: ConnectionDirection;

  /**
   * Creates a new Connection instance with the given token, target address, and connection direction.
   *
   * @param token - The authentication token for the connection.
   * @param targetAddress - The unique address of the target client.
   * @param direction - The direction of the connection (e.g., sending or receiving).
   * @param peerCtor - The constructor for the gRPC client to be used for communication.
   * @param caCertPath - Path to the CA certificate file.
   * @param clientCertPath - Path to the client certificate file.
   * @param clientKeyPath - Path to the client key file.
   */
  constructor(
    token: string,
    targetAddress: string,
    direction: ConnectionDirection,
    peerCtor: any,
    private readonly connectionCerts: {
      caCert: NonSharedBuffer;
      clientCert: NonSharedBuffer;
      clientKey: NonSharedBuffer;
    }
  ) {
    this._token = token;
    this._targetAddress = targetAddress;
    this._peerClient = new peerCtor(targetAddress, grpc.credentials.createInsecure());
    this.direction = direction;

    if (!connectionCerts.caCert || !connectionCerts.clientCert || !connectionCerts.clientKey) {
      throw new Error('Connection certificates are required to create a Connection.');
    }

    // Create grpc credentials
    const sslCreds = grpc.credentials.createSsl(this.connectionCerts.caCert, this.connectionCerts.clientKey, this.connectionCerts.clientCert);

    this._peerClient = new peerCtor(targetAddress, sslCreds);

    this._status = ConnectionStatus.CONNECTED;
  }

  /**
   * Replace newly generated token
   * @param token New token to be replaced
   */
  public set token(token: string) {
    this._token = token;
  }

  /**
   * Revokes the token of the connection, effectively invalidating it.
   * The connection status is set to UNAUTHORIZED.
   */
  public handleRevokeToken(): void {
    this._token = '';
    this._status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * Returns token for this Connection object
   * @returns Connection token
   */
  public get token(): string {
    return this._token;
  }

  /**
   * Returns status for specific
   * @returns Connection status
   */
  public get status(): string {
    return this._status;
  }

  /**
   * Sets the status of this connection.
   * @param status The new status of the connection.
   */
  public set status(status: ConnectionStatus) {
    this._status = status;
  }

  /**
   * Returns target address for this Connection object
   * @returns Target address
   */
  public get targetAddress(): string {
    return this._targetAddress;
  }

  /**
   * "HTTP-like" fetch via gRPC protocol
   * @returns Promise with peer's response
   */
  public fetch(options: FetchOptions = {}): Promise<FetchResponse> {
    if (!this._peerClient) {
      return Promise.reject(new Error(`Peer client not attached for ${this.targetAddress}`));
    }

    // Build a request object
    const method = (options.method ?? 'POST').toUpperCase();
    const path = options.path ?? '/';
    const headers: ConnectionHeaders = { ...(options.headers ?? {}) };

    let bodyBuf: Buffer = Buffer.alloc(0);
    const b = options.body;
    if (b != null) {
      if (Buffer.isBuffer(b)) bodyBuf = b;
      else if (b instanceof Uint8Array) bodyBuf = Buffer.from(b);
      else if (typeof b === 'string') bodyBuf = Buffer.from(b, 'utf8');
      else return Promise.reject(new Error('Body must be a string/Buffer/Uint8Array'));
    }

    const req = { method, path, headers, body: bodyBuf };

    // Return promise with response
    return new Promise<FetchResponse>((resolve, reject) => {
      this._peerClient.Fetch(req, (err: any, resp: any) => {
        if (err) return reject(err);

        const resBody = resp?.body ? Buffer.from(resp.body) : Buffer.alloc(0);
        const fetchResponse: FetchResponse = {
          status: Number(resp?.status ?? 200),
          headers: resp?.headers ?? {},
          body: resBody,
          text: async () => resBody.toString('utf8'),
          json: async () => JSON.parse(resBody.toString('utf8')),
        };

        resolve(fetchResponse);
      });
    });
  }
}
