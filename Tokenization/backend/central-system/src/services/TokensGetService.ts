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

import { setMaxIdleHTTPParsers } from "http";

/**
 * @description Service for retrieving tokens from a data source.
 */
export class TokensGetService {
  constructor() {}
  /**
   * @description Retrieves all tokens from the provided data source.
   * @param tokens - A map representing the data source of tokens.
   * @return An array of token objects containing tokenId, validity, and a truncated payload.
   */
  public async getTokens(
    tokens: Map<number, { tokenId: number; validity: string; payload: string }>
  ): Promise<Array<{ tokenId: number; validity: string; payload: string }>> {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await sleep(1000);
    return Array.from(tokens.values()).map((token) => ({
      tokenId: token.tokenId,
      validity: token.validity,
      payload: token.payload.slice(-5),
    }));
  }
}
