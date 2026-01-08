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
import { ServerController } from '../controllers/ServerController.js';
import { VaultController } from '../controllers/VaultController.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { TokensGetService } from '../services/TokensGetService.js';
import { VaultSignService } from '../services/VaultSignService.js';
import { EncryptionService } from '../services/EncryptionService.js';
import { VaultImportKeyService } from '../services/VaultImportKeyService.js';
import { db } from '../lib/database/Database.js';
import { SequelizeDatabase } from '../lib/database/SequelizeDatabase.js';
import { VaultAuthService } from '../services/VaultAuthService.js';
import { VaultCredentialsService } from '../services/VaultCredentialsService.js';
import { TokensQueryService } from '../services/TokensQueryService.js';
import { ArchiveTokensQueryService } from '../services/ArchiveTokensQueryService.js';
import { ServicesQueryService } from '../services/ServicesQueryService.js';
import { SystemLogsQueryService } from '../services/SystemLogsQueryService.js';
import { EventType } from '../lib/utils/events.js';
import { bus } from '../lib/event-bus/event-bus.js';
import { LogManager } from '@aliceo2/web-ui';
import { RoutesQueryService } from '../services/RoutesQueryService.js';
import { CertificateService } from '../services/CertificateService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/*
 * CentralSystem class to handle token management.
 * It includes methods to get tokens, create a new token, revoke tokens and provide tokens to relevant clients.
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
  private readonly _db: SequelizeDatabase;
  private _logger;

  public readonly connectionController: ConnectionController;
  public readonly vaultController: VaultController;
  public readonly serverController: ServerController;

  public constructor(wrapperPort: number) {
    this._logger = LogManager.getLogger('CentralSystem');
    this._db = db;
    this.serverController = new ServerController(
      this._db,
      new TokensQueryService(),
      new ArchiveTokensQueryService(),
      new ServicesQueryService(),
      new SystemLogsQueryService(),
      new RoutesQueryService(),
      new CertificateService()
    );

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
      new TokensGetService(),
      this._fakeTokens,
      this._centralSystemWrapper
    );

    this.vaultController = new VaultController(
      new VaultSignService(),
      new VaultAuthService(),
      new VaultCredentialsService(),
      new EncryptionService(),
      new VaultImportKeyService()
    );
    this.vaultController.register();
    this.vaultController
      .loginVault()
      .then(() => {})
      .catch((error) => {
        this._logger.errorMessage(`Error during Vault login: ${error.message}`);
      });

    setInterval(() => {
      bus.emit(EventType.RENEW_VAULT_TOKEN, {
        id: 'periodic-renew',
        replyEvent: 'RENEW_VAULT_TOKEN:REPLY:periodic-renew',
        payload: undefined,
      });
    }, 6 * 1000 * 3600); // Renew every 6 hours
  }
}

export default CentralSystem;
