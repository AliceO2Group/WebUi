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

import { VaultCredentialsService } from "../services/VaulCredentialsService";
import { VaultAuthService } from "../services/VaultAuthService";
import { VaultSignService } from "../services/VaultSignService";
import { Agent } from "https";
import {
  SignTokenReq,
  GetCredentialReq,
  CreateOrUpdateCredentialReq,
} from "../lib/event-type.js";

import { registerBusHandler } from "../lib/register-bus-handler.js";

/**
 * @description Controller for managing interactions with the Vault service.
 */
export class VaultController {
  // Agent for HTTPS requests
  private readonly agent: Agent;
  // Access token for Vault
  private readonly vaultAccessToken: string = "";

  /**
   * @description Constructs a new VaultController. Initializes the HTTPS agent using
   * TLS certificates provided via environment variables.
   * @param tokenSignService - Service for signing tokens.
   * @param authService - Service for authenticating with the vault.
   * @param credentialsService - Service for retrieving credentials from the vault.
   * @throws Will throw an error if required environment variables are missing.
   */
  constructor(
    private readonly tokenSignService: VaultSignService,
    private readonly authService: VaultAuthService,
    private readonly credentialsService: VaultCredentialsService
  ) {
    const caPem = process.env.CA_PEM_B64;
    const certPem = process.env.CERT_PEM_B64;
    const keyPem = process.env.KEY_PEM_B64;

    if (!caPem || !certPem || !keyPem) {
      throw new Error(
        "Missing required environment variables for TLS certificates."
      );
    }

    this.agent = new Agent({
      keepAlive: true,
      ca: Buffer.from(caPem, "base64"),
      cert: Buffer.from(certPem, "base64"),
      key: Buffer.from(keyPem, "base64"),
    });
  }

  /**
   * @description Signs a token using the VaultSignService.
   * @param payload - The payload containing the subject and optional claims for the token.
   * @returns A promise that resolves to the signed token and its expiration time.
   */
  public async signToken(payload: any): Promise<string> {
    return this.tokenSignService.signToken(
      process.env.VAULT_ADDR! + "/v1/transit/sign/signing-key",
      this.vaultAccessToken,
      this.agent,
      payload.data
    );
  }
  /**
   * @description Logs into the vault using the VaultAuthService and retrieves an access token.
   * @returns A promise that resolves to the access token.
   */
  public async loginVault(): Promise<string> {
    return this.authService.login(
      process.env.VAULT_ADDR! +
        `/v1/auth/${process.env.VAULT_AUTH_METHOD}/login`,
      process.env.VAULT_AUTH_METHOD!,
      this.agent,
      JSON.stringify({
        name: process.env.VAULT_ROLE,
      })
    );
  }

  /**
   * @description Renews the vault access token using the VaultAuthService.
   * @returns A promise that resolves to the renewed access token.
   */
  public async renewVaultToken(): Promise<string> {
    return this.authService.renew(
      process.env.VAULT_ADDR! + "/v1/auth/token/renew-self",
      this.vaultAccessToken,
      this.agent,
      null
    );
  }

  /**
   * @description Retrieves a credential from the vault using the VaultCredentialsService.
   * @param id - The identifier of the credential to retrieve.
   * @returns A promise that resolves to the retrieved credential.
   */
  public async getCredentialFromVault(path: string): Promise<any> {
    return this.credentialsService.getCredential(
      process.env.VAULT_ADDR! + `/v1/secret/data/${path}`,
      this.vaultAccessToken,
      this.agent
    );
  }

  public async createOrUpdateCredentialInVault(
    path: string,
    body: string
  ): Promise<void> {
    return this.credentialsService.createOrUpdateCredential(
      process.env.VAULT_ADDR! + `/v1/secret/data/${path}`,
      this.vaultAccessToken,
      this.agent,
      body
    );
  }

  /** 
   *  @description Registers the event handlers for vault-related operations.
   *  This method sets up handlers for signing tokens, logging in, renewing tokens,
   *  and managing credentials in the vault.
   */
  public register() {
    registerBusHandler<SignTokenReq>("SIGN_TOKEN_VAULT", async (payload) =>
      this.signToken(payload.data)
    );

    registerBusHandler<undefined>("LOGIN_VAULT", async () => this.loginVault());

    registerBusHandler<undefined>("RENEW_VAULT_TOKEN", async () =>
      this.renewVaultToken()
    );

    registerBusHandler<GetCredentialReq>(
      "GET_CREDENTIAL_VAULT",
      async (payload) => this.getCredentialFromVault(payload.path)
    );

    registerBusHandler<CreateOrUpdateCredentialReq>(
      "CREATE_OR_UPDATE_CREDENTIAL_VAULT",
      async (payload) => {
        await this.createOrUpdateCredentialInVault(payload.path, payload.body);
        return undefined;
      }
    );
  }
}
