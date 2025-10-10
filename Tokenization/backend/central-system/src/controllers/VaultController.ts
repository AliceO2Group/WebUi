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

// Define request and response types for signing tokens
type SignTokenReq = { subject: string; claims?: Record<string, unknown> };
type SignTokenRes = { token: string; exp: number };

/**
 * @description Controller for managing interactions with the Vault service.
 */
export class VaultController {
  // Agent for HTTPS requests
  private readonly agent: Agent;

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

  public register() {
    bus.on(
      "SIGN_TOKEN",
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
          const data = await this.signToken(payload);
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
  }

  async signToken(payload: any) {}
}
