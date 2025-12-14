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
import { VaultEncryptResponse } from '../types/vault_types';

export class EncryptionService {
    /**
     * @description Encrypts data by sending it to an external vault service.
     * @param url - The URL of the external vault service.
     * @param token - The client token for authentication.
     * @param agent - The HTTPS agent to use for the request.
     * @param body - The body of the encrypt request.
     * @return A promise that resolves to the ciphertext returned by the vault service.
     * @throws Will throw an error if encryption fails.
     */
  public async encryptData(
    url: string,
    token: string,
    agent: Agent,
    body: Buffer | string | NodeJS.ReadableStream | null
  ): Promise<string> {
    try {
      const resp = await axios.post<VaultEncryptResponse>(url, body, {
        headers: {
          'content-type': 'application/json',
          'X-Vault-Token': token,
        },
        httpsAgent: agent,
      });
      return resp.data.data.ciphertext;
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
