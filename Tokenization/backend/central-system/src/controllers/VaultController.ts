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

import { VaultCredentialsService } from '../services/VaultCredentialsService.js';
import { VaultAuthService } from '../services/VaultAuthService.js';
import { VaultSignService } from '../services/VaultSignService.js';
import { EncryptionService } from '../services/EncryptionService.js';
import { VaultCreateKeyService } from '../services/VaultCreateKeyService.js';

import { Agent } from 'https';

import {
  SignTokenReq,
  GetCredentialReq,
  CreateOrUpdateCredentialReq,
  VaultEncryptPayloadReq,
  VaultCreateKeyReq,
} from '../lib/utils/event-req-types.js';
import { registerBusHandler } from '../lib/event-bus/register-bus-handler.js';
import { EventType } from '../lib/utils/events.js';

import { LogManager } from '@aliceo2/web-ui';

import {
  SignPayload,
  VaultReadResponse,
  VaultKvWritePayload,
  VaultEncryptPayload,
  VaultCreateKeyPayload,
} from '../types/vault_types.js';

/**
 * @description Controller for managing interactions with the Vault service.
 */
export class VaultController {
  // Agent for HTTPS requests
  private readonly _agent: Agent;
  // Access token for Vault
  private _vaultAccessToken: string = '';
  private _logger;
  /**
   * @description Constructs a new VaultController. Initializes the HTTPS agent using
   * TLS certificates provided via environment variables.
   * @param tokenSignService - Service for signing tokens.
   * @param authService - Service for authenticating with the vault.
   * @param credentialsService - Service for retrieving credentials from the vault.
   * @throws Will throw an error if required environment variables are missing.
   */
  constructor(
    private readonly _tokenSignService: VaultSignService,
    private readonly _authService: VaultAuthService,
    private readonly _credentialsService: VaultCredentialsService,
    private readonly _encryptService: EncryptionService,
    private readonly _createKeyService: VaultCreateKeyService
  ) {
    this._logger = LogManager.getLogger('VaultController');
    const caPem = process.env.VAULT_CACERT_B64;
    const certPem = process.env.VAULT_CENTRAL_SYSTEM_CERT_B64;
    const keyPem = process.env.VAULT_CENTRAL_SYSTEM_KEY_B64;
    if (!caPem || !certPem || !keyPem) {
      throw new Error(
        'Missing required environment variables for TLS certificates.'
      );
    }

    this._agent = new Agent({
      keepAlive: true,
      ca: Buffer.from(caPem, 'base64'),
      cert: Buffer.from(certPem, 'base64'),
      key: Buffer.from(keyPem, 'base64'),
    });
  }

  /**
   * @description Signs a token using the VaultSignService.
   * @param payload - The payload containing the subject and optional claims for the token.
   * @returns A promise that resolves to the signed token and its expiration time.
   * @throws Will throw an error if signing fails.
   */
  public async signToken(payload: SignPayload): Promise<string> {
    try {
      return await this._tokenSignService.signToken(
        process.env.VAULT_ADDR! + '/v1/transit/sign/tokenization-signing',
        this._vaultAccessToken,
        this._agent,
        JSON.stringify(payload)
      );
    } catch (error: any) {
      this._logger.errorMessage(
        `Error signing token with Vault: ${error.message}`
      );
      throw error;
    }
  }
  /**
   * @description Logs into the vault using the VaultAuthService and retrieves an access token.
   * @returns A promise that resolves to the access token.
   * @throws Will throw an error if login fails.
   */
  public async loginVault(): Promise<void> {
    try {
      this._vaultAccessToken = await this._authService.login(
        process.env.VAULT_ADDR! +
          `/v1/auth/${process.env.VAULT_AUTH_METHOD}/login`,
        this._agent,
        JSON.stringify({
          name: process.env.VAULT_ROLE,
        })
      );
    } catch (error: any) {
      this._logger.errorMessage(`Vault login failed: ${error.message}`);
      throw error;
    }
    this._logger.info(
      `Logged into Vault successfully.Token: ${this._vaultAccessToken.slice(
        0,
        6
      )}...`
    );
  }

  /**
   * @description Renews the vault access token using the VaultAuthService.
   * @returns A promise that resolves to the renewed access token.
   */
  public async renewVaultToken(): Promise<void> {
    try {
      await this._authService.renew(
        process.env.VAULT_ADDR! + '/v1/auth/token/renew-self',
        this._vaultAccessToken,
        this._agent,
        null
      );
    } catch (error: any) {
      this._logger.errorMessage(`Vault token renewal failed: ${error.message}`);
      this._logger.info('Attempting to re-login to Vault...');
      await this.loginVault();
    }
    this._logger.info('Vault token renewed successfully.');
  }

  /**
   * @description Retrieves a credential from the vault using the VaultCredentialsService.
   * @param path - The path of the credential to retrieve.
   * @returns A promise that resolves to the retrieved credential.
   * @throws Will throw an error if retrieval fails.
   */
  public async getCredentialFromVault(
    path: string
  ): Promise<VaultReadResponse> {
    try {
      return await this._credentialsService.getCredential(
        process.env.VAULT_ADDR! + `/v1/tokenization/data/${path}`,
        this._vaultAccessToken,
        this._agent
      );
    } catch (error: any) {
      this._logger.errorMessage(
        `Error getting credential from Vault: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * @description Creates or updates a credential in the vault using the VaultCredentialsService.
   * @param path - The path where the credential should be stored.
   * @param body - The body of the credential to create or update.
   * @returns A promise that resolves when the operation is complete.
   * @throws Will throw an error if the operation fails.
   */
  public async createOrUpdateCredentialInVault(
    path: string,
    body: VaultKvWritePayload
  ): Promise<void> {
    try {
      await this._credentialsService.createOrUpdateCredential(
        process.env.VAULT_ADDR! + `/v1/tokenization/data/${path}`,
        this._vaultAccessToken,
        this._agent,
        JSON.stringify(body)
      );
    } catch (error: any) {
      this._logger.errorMessage(
        `Error creating/updating credential in Vault: ${error.message}`
      );
      throw error;
    }
  }

  /**   * @description Encrypts data using the EncryptionService.
   * @param key - The encryption key to use.
   * @param body - The body of the encrypt request.
   * @return A promise that resolves to the ciphertext.
   * @throws Will throw an error if encryption fails.
   */
  public async encryptData(
    key: string,
    body: VaultEncryptPayload
  ): Promise<string> {
    try {
      return await this._encryptService.encryptData(
        process.env.VAULT_ADDR! + `/v1/transit/encrypt/${key}`,
        this._vaultAccessToken,
        this._agent,
        JSON.stringify(body)
      );
    } catch (error: any) {
      this._logger.errorMessage(`Error encrypting data: ${error.message}`);
      throw error;
    }
  }

  /**   * @description Creates a new encryption key in the vault using the VaultCreateKeyService.
   * @param keyName - The name of the key to create.
   * @param body - The body of the create key request.
   * @return A promise that resolves when the key is created.
   * @throws Will throw an error if key creation fails.
   */
  public async createKeyInVault(
    keyName: string,
    body: VaultCreateKeyPayload
  ): Promise<void> {
    try {
      await this._createKeyService.createKey(
        process.env.VAULT_ADDR! + `/v1/transit/keys/${keyName}`,
        this._vaultAccessToken,
        this._agent,
        JSON.stringify(body)
      );
    } catch (error: any) {
      this._logger.errorMessage(
        `Error creating key in Vault: ${error.message}`
      );
      throw error;
    }
  }

  /**
   *  @description Registers the event handlers for vault-related operations.
   *  This method sets up handlers for signing tokens, logging in, renewing tokens, encryption,
   *  and managing credentials in the vault.
   */
  public register() {
    registerBusHandler<SignTokenReq>(
      EventType.SIGN_TOKEN_VAULT,
      async (payload) => this.signToken(payload)
    );

    registerBusHandler<undefined>(EventType.LOGIN_VAULT, async () =>
      this.loginVault()
    );

    registerBusHandler<undefined>(EventType.RENEW_VAULT_TOKEN, async () =>
      this.renewVaultToken()
    );

    registerBusHandler<GetCredentialReq>(
      EventType.GET_CREDENTIAL_VAULT,
      async (payload) => this.getCredentialFromVault(payload.path)
    );

    registerBusHandler<CreateOrUpdateCredentialReq>(
      EventType.CREATE_OR_UPDATE_CREDENTIAL_VAULT,
      async (payload) =>
        this.createOrUpdateCredentialInVault(payload.path, payload.body)
    );

    registerBusHandler<VaultEncryptPayloadReq>(
      EventType.ENCRYPT_TOKEN_VAULT,
      async (payload) => this.encryptData(payload.key, payload.body)
    );

    registerBusHandler<VaultCreateKeyReq>(
      EventType.CREATE_KEY_VAULT,
      async (payload) => this.createKeyInVault(payload.keyName, payload.body)
    );
  }
}
