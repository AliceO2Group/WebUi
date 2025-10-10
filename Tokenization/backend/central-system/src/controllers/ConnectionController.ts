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

import { CentralSystemWrapper } from '../wrapper/CentralSystemWrapper';
import {
  DuplexMessageEvent,
  ConnectionDirection,
} from '../services/models/message.model.js';

import {
  LogManager,
  InvalidInputError,
  updateAndSendExpressResponseFromNativeError,
} from '@aliceo2/web-ui';

import type { Request, Response } from 'express';

import { TokensGetService } from '../services/TokensGetService.js';

/**
 * @description Controller for managing tokens in the Central System.
 */
export class ConnectionController {
  private _logger;

  /**
   * @description Initializes the TokensController with a map of fake tokens and a CentralSystemWrapper instance.
   * @param fakeTokens - A map simulating a database of tokens.
   * @param centralSystemWrapper - An instance of CentralSystemWrapper to handle client connections.
   */
  constructor(
    private readonly _tokensGetService: TokensGetService,
    private readonly _tokensService: Map<
      number,
      { tokenId: number; validity: string; payload: string }
    >,
    private readonly _centralSystemWrapper: CentralSystemWrapper
  ) {
    this._logger = LogManager.getLogger('TokensController');
  }
  /**
   * @description Retrieves all tokens data source. Returns a serialized binary payload of the tokens.
   * @param req - The request object.
   * @param res - The response object.
   * @return {Promise<void>}
   */
  public async getTokensHandler(req: Request, res: Response): Promise<void> {
    try {
      const tokens = await this._tokensGetService.getTokens(
        this._tokensService
      );
      res.status(200).json(tokens);
    } catch (error: any) {
      if (error.stack) {
        this._logger.trace(error);
      }
      this._logger.errorMessage(
        `Error while retrieving run types: ${error.message}`
      );

      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   * @description Creates a new token with the provided payload.
   * @param req - The request object containing the payload.
   * @param res - The response object.
   * @return {Promise<void>}
   */
  public async createTokenHandler(req: Request, res: Response): Promise<void> {
    try {
      const { payload } = req.body;
      if (!this._isTokenPayloadValid(payload))
        throw new InvalidInputError('Invalid token payload');

      const newTokenId = this._tokensService.size + 1;
      const newToken = {
        tokenId: newTokenId,
        validity: 'good',
        payload,
      };
      this._tokensService.set(newTokenId, newToken);

      const client: string =
        this._centralSystemWrapper.getConnectedClients()[0];

      this._centralSystemWrapper.sendEvent(client, {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {
          connectionDirection: ConnectionDirection.SENDING,
          targetAddress: 'a',
          token: 'newToken',
        },
      });

      res.status(201).json('Token created successfully');
    } catch (error: any) {
      if (error.stack) {
        this._logger.trace(error);
      }
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }

  /**
   *
   * @param payload - The payload to be validated.
   * @description Validates the payload of a token.
   * @return {boolean}
   */
  private _isTokenPayloadValid(payload: string): boolean {
    if (!payload) {
      return false;
    }
    return true;
  }

  /**
   * @description Validates the token ID.
   * @param id - The ID of the token to be validated.
   * @return {boolean}
   */
  private _isTokenIDValid(id: number): boolean {
    if (!id) {
      return false;
    }
    if (!this._tokensService.has(id)) {
      return false;
    }
    return true;
  }

  /**
   * @description Revokes a token for a specific client.
   * @param client - The client ID for which the token is revoked.
   * @param tokenEncypted - The encrypted token to be revoked.
   * @return {Promise<void>}
   */
  public async revokeTokenHandler(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.body;
      const idNumber = parseInt(id, 10);
      if (!this._isTokenIDValid(idNumber))
        throw new InvalidInputError('Invalid token ID');
      this._tokensService.delete(idNumber);

      const client: string =
        this._centralSystemWrapper.getConnectedClients()[0];

      this._centralSystemWrapper.sendEvent(client, {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        payload: {
          connectionDirection: ConnectionDirection.SENDING,
          targetAddress: 'a',
        },
      });

      res.status(204).json('Token revoked successfully');
    } catch (error: any) {
      if (error.stack) {
        this._logger.trace(error);
      }
      updateAndSendExpressResponseFromNativeError(res, error);
    }
  }
}
