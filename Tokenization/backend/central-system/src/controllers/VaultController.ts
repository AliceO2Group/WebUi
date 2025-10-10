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
import { bus } from "../lib/event-bus";
import { SignTokenReq, GetCredentialReq, CreateOrUpdateCredentialReq } from "../lib/event-type.js";


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
   * @description Registers event listeners for handling vault-related requests.
   * The listeners respond to events for signing tokens, logging in, and renewing tokens.
   * Each listener emits a reply event with the result or an error.
   * This method should be called once during the application initialization.
   * @throws Will throw an error if event registration fails.
   */
  public register() {
    bus.on(
      "SIGN_TOKEN_VAULT",
      async ({
        id,
        replyEvent,
        payload,
      }: {
        id: string;
        replyEvent: string;
        payload: SignTokenReq;
      }) => {
        try {
          const data = await this.signToken(payload.data);
          bus.emit(replyEvent, { ok: true as const, data });
        } catch (err: any) {
          bus.emit(replyEvent, {
            ok: false as const,
            error: {
              message: err?.message ?? "Unknown error",
              code: err?.code,
              stack: err?.stack,
            },
          });
        }
      }
    );
    bus.on(
      "LOGIN_VAULT",
      async ({ id, replyEvent }: { id: string; replyEvent: string }) => {
        try {
          const data = await this.loginVault();
          bus.emit(replyEvent, { ok: true as const, data });
        } catch (err: any) {
          bus.emit(replyEvent, {
            ok: false as const,
            error: {
              message: err?.message ?? "Unknown error",
              code: err?.code,
              stack: err?.stack,
            },
          });
        }
      }
    );
    bus.on(
      "RENEW_VAULT_TOKEN",
      async ({ id, replyEvent }: { id: string; replyEvent: string }) => {
        try {
          const data = await this.renewVaultToken();
          bus.emit(replyEvent, { ok: true as const, data });
        } catch (err: any) {
          bus.emit(replyEvent, {
            ok: false as const,
            error: {
              message: err?.message ?? "Unknown error",
              code: err?.code,
              stack: err?.stack,
            },
          });
        }
      }
    );

    bus.on(
      "GET_CREDENTIAL_VAULT",
      async ({
        id,
        replyEvent,
        payload,
      }: {
        id: string;
        replyEvent: string;
        payload: GetCredentialReq;
      }) => {
        try {
          const data = await this.getCredentialFromVault(payload.path);
          bus.emit(replyEvent, { ok: true as const, data });
        } catch (err: any) {
          bus.emit(replyEvent, {
            ok: false as const,
            error: {
              message: err?.message ?? "Unknown error",
              code: err?.code,
              stack: err?.stack,
            },
          });
        }
      }
    );

    bus.on(
      "CREATE_OR_UPDATE_CREDENTIAL_VAULT",
      async ({
        id,
        replyEvent,
        payload,
      }: {
        id: string;
        replyEvent: string;
        payload: CreateOrUpdateCredentialReq;
      }) => {
        try {
          await this.createOrUpdateCredentialInVault(
            payload.path,
            payload.body
          );
          bus.emit(replyEvent, { ok: true as const });
        } catch (err: any) {
          bus.emit(replyEvent, {
            ok: false as const,
            error: {
              message: err?.message ?? "Unknown error",
              code: err?.code,
              stack: err?.stack,
            },
          });
        }
      }
    );
  }
}
