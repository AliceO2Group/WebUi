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

import { CentralSystemWrapper } from '../wrapper/CentralSystemWrapper.js';
import { TokensController } from '../controllers/TokensController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { TokensGetService } from '../services/TokensGetService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*
 * CentralSystem class to handle token management.
 * It includes methods to get tokens, create a new token, revoke tokens and provide tokens to relecant clients.
 * The class uses a static Map to simulate a database of tokens.
 * The tokens are stored with a tokenId, validity status, and payload.
 */
class CentralSystem {
  private _centralSystemWrapper: CentralSystemWrapper;
  private PROTO_PATH = path.join(__dirname, '../../proto/wrapper.proto');
  private _fakeTokens: Map<
    number,
    { tokenId: number; validity: string; payload: string }
  >;
  public readonly tokenController: TokensController;

  public constructor(wrapperPort: number) {
    const tokensGetService = new TokensGetService();
    this._centralSystemWrapper = new CentralSystemWrapper(
      this.PROTO_PATH,
      wrapperPort
    );
    this._centralSystemWrapper.listen();
    this._fakeTokens = new Map([
      [1, { tokenId: 1, validity: 'good', payload: 'payload1' }],
      [2, { tokenId: 2, validity: 'bad', payload: 'payload2' }],
    ]);
    this.tokenController = new TokensController(
      tokensGetService,
      this._fakeTokens,
      this._centralSystemWrapper
    );
  }
}

export default CentralSystem;
