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

import { ConnectionDirection } from '../../models/message.model';
import { ConnectionStatus, type ConnectionHeaders, type FetchOptions, type FetchResponse } from '../../models/connection.model';
import * as grpc from '@grpc/grpc-js';
import { LogManager } from '@aliceo2/web-ui';
import { RetryQueue, type RetryTask } from '../../utils/queues/RetryQueue';
import { genId } from '../../utils/custom.identifier';
import { TOKEN_REASON_HEADER, TokenAuthReason, type TokenPayload } from '../../models/token.model';

type ConnectionCerts = {
  caCert: Buffer;
  clientCert: Buffer;
  clientKey: Buffer;
};

/**
 * @description This class represents a connection to a target client and manages sending messages to it.
 */
export class Connection {
  private _jweToken: string;
  private _status: ConnectionStatus;
  private _peerClient?: any; // A client grpc connection instance

  // Security management variables
  private _clientSerialNumber?: string; // The certificate SN used to uniquely identify the peer.
  private _lastActiveTimestamp: number; // Timestamp of the last successful request (for garbage collection).
  private _authFailures: number; // Counter for consecutive authentication failures (for anti-DDoS/throttling).
  private _cachedTokenPayload?: TokenPayload; // Cache of the successfully verified token payload.

  private _targetAddress: string;
  public direction: ConnectionDirection;

  // Utils
  private _logger;
  private _retryQueue = new RetryQueue({
    maxRetries: 5,
    baseDelayMs: 300,
    maxDelayMs: 8000,
    jitter: true,
  });
  private _pendingTokenRefresh?: Promise<void>;
  private _isRefreshing = false;

  // For debug purposes
  private _failedRequestsLog: Array<{
    id: string;
    method: string;
    path: string;
    reason: string;
    at: number;
    tryNo: number;
  }> = [];

  /**
   * Creates a new Connection instance with the given token, target address, and connection direction.
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
    private renewToken: (token: string, targetAddress: string) => void,
    clientSN?: string
  ) {
    this._jweToken = jweToken;
    this._targetAddress = targetAddress;
    this.direction = direction;

    // Initialize state fields
    this._clientSerialNumber = clientSN;
    this._lastActiveTimestamp = Date.now();
    this._authFailures = 0;
    this._status = ConnectionStatus.CONNECTED;

    this._logger = LogManager.getLogger(`Connection ${targetAddress}`);
  }

  /**
   * Creates the mTLS gRPC client and attaches it to the connection.
   * This method is REQUIRED ONLY for outbound (SENDING) connections.
   * * @param peerCtor - The constructor for the gRPC client to be used for communication.
   * @param connectionCerts - Required sending client certificates for mTLS.
   */
  public createSslTunnel(peerCtor: any, connectionCerts: ConnectionCerts): void {
    if (this.direction !== ConnectionDirection.SENDING) {
      this._logger.warnMessage('Attempted to create SSL tunnel on a RECEIVING connection. This is usually unnecessary.');
    }

    if (!connectionCerts.caCert || !connectionCerts.clientCert || !connectionCerts.clientKey) {
      throw new Error('Connection certificates are required to create an mTLS tunnel.');
    }

    // Create grpc credentials
    const sslCreds = grpc.credentials.createSsl(connectionCerts.caCert, connectionCerts.clientKey, connectionCerts.clientCert);

    this._peerClient = new peerCtor(this.targetAddress, sslCreds);
    this.status = ConnectionStatus.CONNECTED;
  }

  /**
   * Replace newly generated token
   * @param jweToken New token to be replaced
   */
  public handleNewToken(jweToken: string): void {
    this._jweToken = jweToken;

    // Reset
    this._authFailures = 0;
    this.status = ConnectionStatus.CONNECTED;

    // Drain retry queue on all after hanling new token
    this._retryQueue.drainNow();

    // End of refreshing
    this._isRefreshing = false;
    const p = this._pendingTokenRefresh;
    this._pendingTokenRefresh = undefined;
    // If someone awaited pendingTokenRefresh then we resolve it:
    if (p) {
      (p as any)._resolve?.(); // CreateTokenRefreshPromise
    }
  }

  /**
   * Revoke current token and set status of unauthorized connection
   */
  public handleRevokeToken(): void {
    this._jweToken = '';
    this.status = ConnectionStatus.UNAUTHORIZED;
  }

  /**
   * Handles a successful authentication event. Updates the active timestamp,
   * resets the failure counter, and caches the new token payload.
   * This is crucial for high-performance applications to avoid re-validating the same token.
   * @param payload The decoded and verified token payload.
   */
  public handleSuccessfulAuth(payload: TokenPayload): void {
    this._lastActiveTimestamp = Date.now();
    this._authFailures = 0;
    this._cachedTokenPayload = payload;
    this.status = ConnectionStatus.CONNECTED;
  }

  /**
   * Handles an authentication failure. Increments the failure counter.
   * If the failure count exceeds a local threshold, the connection is locally marked as BLOCKED.
   * @returns The new count of consecutive failures.
   */
  public handleFailedAuth(): number {
    this._authFailures += 1;

    // Local throttling mechanism
    if (this._authFailures >= 5) {
      this.status = ConnectionStatus.BLOCKED;
    }
    return this._authFailures;
  }

  /**
   * Returns token for this Connection object
   * @returns Connection token
   */
  public get token(): string {
    return this._jweToken;
  }

  /**
   * Returns status for specific
   * @returns Connection status
   */
  public get status() {
    return this._status;
  }

  /**
   * Updates the status of the connection.
   * @param status New status
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
   * Returns the client's Serial Number (SN).
   * @returns The client's serial number or undefined.
   */
  public get serialNumber(): string | undefined {
    return this._clientSerialNumber;
  }

  /**
   * Sets the client's Serial Number. Primarily used for RECEIVING connections
   * where the SN is extracted during the first mTLS handshake in the interceptor.
   * @param serialNumber The serial number string.
   */
  public set serialNumber(serialNumber: string) {
    this._clientSerialNumber = serialNumber;
  }

  /**
   * Returns the timestamp of the last successful interaction.
   * @returns UNIX timestamp in milliseconds.
   */
  public get lastActiveTimestamp(): number {
    return this._lastActiveTimestamp;
  }

  /**
   * Returns the cached token payload.
   * @returns The cached payload or undefined.
   */
  public get cachedTokenPayload(): TokenPayload | undefined {
    return this._cachedTokenPayload;
  }

  /**
   * Attaches gRPC client to that connection
   */
  public attachGrpcClient(client: any): void {
    this._peerClient = client;
  }

  // -----------------------------------------------------------------------------------------------------------------------------
  //                                                  FETCH HANDLING SECTION
  // -----------------------------------------------------------------------------------------------------------------------------
  /**
   * Waits for the token to be refreshed
   * @returns Promise<void>
   */
  private async awaitTokenRefresh(): Promise<void> {
    if (!this._pendingTokenRefresh) return;
    return this._pendingTokenRefresh;
  }

  /**
   * Creates a promise that resolves when a new token is refreshed
   * It is used internally to handle the token refresh process.
   * If the token is currently being refreshed, it returns the existing promise.
   * If not, it creates a new promise and stores it in the connection object.
   * When the new token is received, it resolves the promise.
   * @returns A promise that resolves when the token is refreshed.
   */
  private createTokenRefreshPromise(): Promise<void> {
    if (this._pendingTokenRefresh) return this._pendingTokenRefresh;

    let _resolve!: () => void;
    let _reject!: (e: any) => void;
    const newPromise = new Promise<void>((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    }) as any;
    // Add reference to be resolved by handleNewToken
    newPromise._resolve = _resolve;
    newPromise._reject = _reject;
    this._pendingTokenRefresh = newPromise;
    return newPromise;
  }

  /**
   * Triggers token renewal if not already in progress.
   * Updates connection status to TOKEN_REFRESH and creates a new promise to be resolved when the new token is received.
   * Logs a warning message with the reason for the token renewal.
   * @param reason The reason for the token renewal.
   */
  private triggerTokenRenewIfNeeded(reason: TokenAuthReason) {
    if (
      this._isRefreshing ||
      (reason !== TokenAuthReason.PERMISSION_EXPIRED && reason !== TokenAuthReason.NO_TOKEN && reason !== TokenAuthReason.PERMISSION_FORBIDDEN)
    )
      return;
    this._isRefreshing = true;
    this._status = ConnectionStatus.TOKEN_REFRESH;
    this.createTokenRefreshPromise(); // Sets pendingTokenRefresh
    this._logger.warnMessage(`Trigger token renew due to: ${TokenAuthReason[reason]}`);
    this.renewToken(this._jweToken, this._targetAddress);
  }

  /**
   * Performs a fetch-like request over a gRPC connection.
   * Returns a promise that resolves with a FetchResponse object, containing the response status, headers, and body.
   * The body can be accessed as a Buffer, or as a string or JSON object using the text() and json() methods respectively.
   * @param req The request object to be sent over the gRPC connection.
   * @param metadata The metadata object to be sent with the request.
   * @returns A promise that resolves with a FetchResponse object.
   */
  private grpcFetch(req: any, metadata: grpc.Metadata): Promise<FetchResponse> {
    return new Promise<FetchResponse>((resolve, reject) => {
      if (!this._peerClient) {
        return reject(new Error(`Peer client not attached for ${this._targetAddress}`));
      }

      this._peerClient.Fetch(req, metadata, (err: any, resp: any) => {
        if (err) return reject(err);

        const resBody = resp?.body ? Buffer.from(resp.body) : Buffer.alloc(0);
        resolve({
          status: Number(resp?.status ?? 200),
          headers: resp?.headers ?? {},
          body: resBody,
          text: async () => resBody.toString('utf8'),
          json: async () => JSON.parse(resBody.toString('utf8')),
        });
      });
    });
  }

  /**
   * Checks if the given TokenAuthReason is eligible for token renewal.
   * @param reason The reason for the authentication failure, or undefined if the authentication succeeded.
   * @returns True if the reason is eligible for token renewal, false otherwise.
   */
  private isAuthRenewable(reason: TokenAuthReason | undefined): boolean {
    return (
      reason === TokenAuthReason.NO_TOKEN ||
      reason === TokenAuthReason.PERMISSION_EXPIRED ||
      reason === TokenAuthReason.JWE_DECRYPT_FAIL ||
      reason === TokenAuthReason.JWS_INVALID ||
      reason === TokenAuthReason.SERIAL_MISMATCH
    );
  }

  /**
   * "HTTP-like" fetch via gRPC protocol
   * @returns Promise with peer's response
   */
  public async fetch(options: FetchOptions = {}): Promise<FetchResponse> {
    if (!this._peerClient) {
      throw new Error(`Peer client not attached for ${this._targetAddress}`);
    }
    if (this.status === ConnectionStatus.BLOCKED) {
      throw new Error('Connection is blocked. Contact your admin for further details.');
    }

    const method = (options.method ?? 'POST').toUpperCase();
    const path = options.path ?? '/';
    const headers: ConnectionHeaders = { ...(options.headers ?? {}) };

    const metadata = new grpc.Metadata();
    metadata.set('jwetoken', this._jweToken);

    let bodyBuf: Buffer = Buffer.alloc(0);
    const b = options.body;
    if (b != null) {
      if (Buffer.isBuffer(b)) bodyBuf = b;
      else if (b instanceof Uint8Array) bodyBuf = Buffer.from(b);
      else if (typeof b === 'string') bodyBuf = Buffer.from(b, 'utf8');
      else throw new Error('Body must be a string/Buffer/Uint8Array');
    }

    const req = { method, path, headers, body: bodyBuf };

    // If someone is already refreshing token then wait and retry
    if (this.status === ConnectionStatus.TOKEN_REFRESH) {
      await this.awaitTokenRefresh();
      // After refresh we have new token to setup in metadata
      const meta = new grpc.Metadata();
      meta.set('jwetoken', this._jweToken);
      return this.grpcFetch(req, meta);
    }

    // First try of request fetching
    try {
      return await this.grpcFetch(req, metadata);
    } catch (err: any) {
      const reason: TokenAuthReason | undefined = err?.metadataMap?.get?.(TOKEN_REASON_HEADER);

      if (!this.isAuthRenewable(reason)) {
        // Errors that are not eligible for token renewal (e.g. FORBIDDEN, BLOCKED, INTERNAL, etc.)
        this._logger.errorMessage(`Error fetching for ${this.targetAddress}: (${method}):`, err);
        throw err;
      }

      // Queue and refresh section
      const id = genId(); // Id of the request
      this._failedRequestsLog.push({
        id,
        method,
        path,
        reason: TokenAuthReason[reason!],
        at: Date.now(),
        tryNo: 1,
      });

      // Trigger renewal
      this.triggerTokenRenewIfNeeded(reason!);

      // Create retry fetch object that will resolve when the token is refreshed
      return new Promise<FetchResponse>((resolve, reject) => {
        const task: RetryTask<FetchResponse> = {
          id,
          tryNo: 1,
          createdAt: Date.now(),
          reason: TokenAuthReason[reason!],
          // Retry function – will be executed after a drainNow() or after a backoff
          exec: async () => {
            // If still refreshing token then wait
            await this.awaitTokenRefresh();
            const meta = new grpc.Metadata();
            meta.set('jwetoken', this._jweToken);
            return this.grpcFetch(req, meta);
          },
          resolve,
          reject,
        };

        this._retryQueue.enqueue(task);
      });
    }
  }
}
