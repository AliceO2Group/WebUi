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

import { Agent } from 'https';
import axios from 'axios';
import { VaultTransitImportRsaPublicKeyPayload } from '../types/vault_types.js';

export class VaultImportKeyService {
  /**
   * @description Creates a new encryption key in Vault.
   * @param url - The URL of the Vault service.
   * @param token - The client token for authentication.
   * @param agent - The HTTPS agent to use for the request.
   * @param body - The body of the create key request.
   * @return A promise that resolves when the key is created.
   * @throws Will throw an error if key creation fails.
   */
  public async importKey(
    url: string,
    token: string,
    agent: Agent,
    body: VaultTransitImportRsaPublicKeyPayload
  ): Promise<void> {
    try {
      await axios.post(url, body, {
        headers: {
          'content-type': 'application/json',
          'X-Vault-Token': token,
        },
        httpsAgent: agent,
      });
    } catch (err: any) {
      const message = err?.response?.data
        ? typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data)
        : err?.message ?? 'Unknown error';
      throw new Error(message);
    }
  }
}
