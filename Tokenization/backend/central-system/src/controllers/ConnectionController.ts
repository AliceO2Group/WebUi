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

import { CentralSystemWrapper } from "../lib/CentralSystemWrapper.js";
import {
  DuplexMessageEvent,
  ConnectionDirection,
} from "../services/models/message.model.js";

import { LogManager, InvalidInputError } from "@aliceo2/web-ui";

import type { Request, Response } from "express";

import { TokensGetService } from "../services/TokensGetService.js";

const logger = LogManager.getLogger("TokensController");

/**
 * @description Controller for managing tokens in the Central System.
 */
export class ConnectionController {
  private tokensService: Map<
    number,
    { tokenId: number; validity: string; payload: string }
  >;

  private centralSystemWrapperService: CentralSystemWrapper;
  /**
   * @description Initializes the TokensController with a map of fake tokens and a CentralSystemWrapper instance.
   * @param fakeTokens - A map simulating a database of tokens.
   * @param centralSystemWrapper - An instance of CentralSystemWrapper to handle client connections.
   */
  constructor(
    private readonly tokensGetService: TokensGetService,
    fakeTokens: Map<
      number,
      { tokenId: number; validity: string; payload: string }
    >,
    centralSystemWrapper: CentralSystemWrapper
  ) {
    this.tokensService = fakeTokens;
    this.centralSystemWrapperService = centralSystemWrapper;
  }
  /**
   * @description Retrieves all tokens data source. Returns a serialized binary payload of the tokens.
   * @param req - The request object.
   * @param res - The response object.
   * @return {Promise<void>}
   */
  public async getTokensHandler(req: Request, res: Response): Promise<void> {
    try {
      const tokens = await this.tokensGetService.getTokens(this.tokensService);
      res.status(200).json(tokens);
    } catch (error: any) {
      if (error.stack) {
        logger.trace(error);
      }
      logger.errorMessage(`Error while retrieving run types: ${error.message}`);

      res.status(500).json({ error: "Failed to retrieve tokens" });
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
      await this._validateTokenPayload(payload);

      const newTokenId = this.tokensService.size + 1;
      const newToken = {
        tokenId: newTokenId,
        validity: "good",
        payload: payload,
      };
      this.tokensService.set(newTokenId, newToken);

      const client: string = Array.from(
        this.centralSystemWrapperService.getConnectedClients()
      )[0];

      this.centralSystemWrapperService.sendEvent(client, {
        event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
        payload: {
          connectionDirection: ConnectionDirection.SENDING,
          targetAddress: "a",
          token: "newToken",
        },
      });

      res.status(201).json("Token created successfully");
    } catch (error: any) {
      if (error.stack) {
        logger.trace(error);
      }
      if (error instanceof InvalidInputError) {
        logger.errorMessage(`Invalid input: ${error.message}`);

        res.status(400).json({ error: error.message });
      } else if (error instanceof Error) {
        logger.errorMessage(`Error while creating a token: ${error.message}`);

        res.status(500).json({ error: "Failed to create a token" });
      }
    }
  }

  /**
   *
   * @param payload - The payload to be validated.
   * @description Validates the payload of a token.
   * @throws {InvalidInputError} If the payload is empty.
   * @return {Promise<void>}
   */
  private async _validateTokenPayload(payload: string): Promise<void> {
    if (!payload) {
      throw new InvalidInputError("Payload cannot be empty");
    }
  }

  /**
   * @description Validates the token ID.
   * @param id - The ID of the token to be validated.
   * @throws {InvalidInputError} If the ID is missing or invalid.
   * @return {Promise<void>}
   */
  private async _validateTokenID(id: number): Promise<void> {
    if (!id) {
      throw new InvalidInputError("Missing token ID");
    }
    if (!this.tokensService.has(id)) {
      throw new InvalidInputError(`Token with ID ${id} does not exist`);
    }
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
      await this._validateTokenID(idNumber);
      this.tokensService.delete(idNumber);

      const client: string = Array.from(
        this.centralSystemWrapperService.getConnectedClients()
      )[0];

      this.centralSystemWrapperService.sendEvent(client, {
        event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
        payload: {
          connectionDirection: ConnectionDirection.SENDING,
          targetAddress: "a",
          token: "newToken",
        },
      });

      res.status(204).json("Token revoked successfully");
    } catch (error: any) {
      if (error.stack) {
        logger.trace(error);
      }
      if (error instanceof InvalidInputError) {
        logger.errorMessage(`Invalid input: ${error.message}`);

        res.status(400).json({ error: error.message });
      } else if (error instanceof Error) {
        logger.errorMessage(`Error while revoking the token: ${error.message}`);

        res.status(500).json({ error: "Failed to revoke the token" });
      }
    }
  }
}
