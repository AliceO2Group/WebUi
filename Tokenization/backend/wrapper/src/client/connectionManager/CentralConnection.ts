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

import type * as grpc from '@grpc/grpc-js';
import { LogManager } from '@aliceo2/web-ui';
import type { CentralCommandDispatcher } from './eventManagement/CentralCommandDispatcher';
import type { DuplexMessageModel } from '../../models/message.model';

/**
 * This class manages the duplex stream with the CentralSystem gRPC service.
 * It is responsible for connecting, reconnecting with backoff, and delegating received messages.
 */
export class CentralConnection {
  private _logger = LogManager.getLogger('CentralConnection');
  private _stream?: grpc.ClientDuplexStream<unknown, unknown>;

  /**
   * Constructor for the CentralConnection class.
   *
   * @param {_client} - The gRPC client instance used to connect to the CentralSystem.
   * @param {_dispatcher} - The CentralCommandDispatcher instance used to delegate incoming messages.
   * @param {centralAddress} - The address of the CentralSystem gRPC service.
   */
  constructor(private _client: any, private _dispatcher: CentralCommandDispatcher, public centralAddress: string) {}

  /**
   * Initializes the duplex stream and sets up event handlers.
   */
  connect() {
    if (this._stream) return;

    this._stream = this._client.ClientStream();

    this._stream?.on('data', (payload: DuplexMessageModel) => {
      this._logger.debugMessage(`Received payload: ${JSON.stringify(payload)}`);
      this._dispatcher.dispatch(payload);
    });

    this._stream?.on('end', () => {
      this._logger.infoMessage(`Stream ended, attempting to reconnect...`);
      this._stream = undefined;
      this.scheduleReconnect();
    });

    this._stream?.on('error', (err: any) => {
      this._logger.infoMessage('Stream error:', err, ' attempting to reconnect...');
      this._stream = undefined;
      this.scheduleReconnect();
    });
  }

  /**
   * Schedules a reconnect with exponential backoff.
   */
  private scheduleReconnect() {
    setTimeout(() => {
      this._logger.infoMessage(`Trying to reconnect...`);
      this.connect();
    }, 2000);
  }

  /**
   * Starts the connection to the central system.
   */
  start() {
    this.connect();
    this._logger.infoMessage(`Connected to CentralSystem on ${this.centralAddress}`);
  }

  /**
   * Disconnects from the gRPC stream and resets attempts.
   */
  disconnect() {
    if (this._stream) {
      this._stream.end();
      this._stream = undefined;
    }
    this._logger.infoMessage(`Disconnected from CentralSystem`);
  }
}
