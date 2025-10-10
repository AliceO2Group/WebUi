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

import { CentralSystemWrapper } from '../lib/CentralSystemWrapper.js';
import { ConnectionController } from '../controllers/ConnectionController.js';
import { VaultController } from '../controllers/VaultController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { TokensGetService } from '../services/TokensGetService.js';
import { VaultSignService } from '../services/VaultSignService.js';
import { db } from '../lib/database/Database.js';
import { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';
import { VaultAuthService } from '../services/VaultAuthService.js';
import { VaultCredentialsService } from '../services/VaulCredentialsService.js';
import { EventType } from '../lib/events.js';
import { bus } from '../lib/event-bus.js';

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
  private PROTO_PATH = path.join(__dirname, '../../../proto/wrapper.proto');
  private _fakeTokens: Map<
    number,
    { tokenId: number; validity: string; payload: string }
  >;
  public readonly connectionController: ConnectionController;
  public readonly vaultController: VaultController;
  private _db: SequelizeDatabase;

  public constructor(wrapperPort: number) {
    this._db = db;
    const tokensGetService = new TokensGetService();
    const vaultSignService = new VaultSignService();
    this._centralSystemWrapper = new CentralSystemWrapper(
      this.PROTO_PATH,
      wrapperPort
    );
    this._centralSystemWrapper.listen();
    this._fakeTokens = new Map([
      [1, { tokenId: 1, validity: 'good', payload: 'payload1' }],
      [2, { tokenId: 2, validity: 'bad', payload: 'payload2' }],
    ]);
    this.connectionController = new ConnectionController(
      tokensGetService,
      this._fakeTokens,
      this._centralSystemWrapper
    );
    this.vaultController = new VaultController(
      new VaultSignService(),
      new VaultAuthService(),
      new VaultCredentialsService()
    );
    this.vaultController.register();
    this.vaultController
      .loginVault()
      .then(() => {})
      .catch((error) => {
        console.error('Failed to log in to Vault:', error);
      });

    setInterval(() => {
      bus.emit(EventType.RENEW_VAULT_TOKEN, {
        id: 'periodic-renew',
        replyEvent: 'RENEW_VAULT_TOKEN:REPLY:periodic-renew',
        payload: undefined,
      });
    }, 6 * 3600 * 1000); // Renew every 6 hours
  }
}

export default CentralSystem;
