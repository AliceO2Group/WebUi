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
import { VaultReadResponse } from '../types/vault_types.js';
import { VaultKvWritePayload } from '../types/vault_types.js';

/**
 * * @description Service for retrieving credentials from an external vault service.
 */
export class VaultCredentialsService {
  /**
   * @description Retrieves credentials by sending a request to an external vault service.
   * @param url - The URL of the external vault service.
   * @param token - The JWT token for authentication.
   * @param agent - The HTTPS agent to use for the request.
   * @return A promise that resolves to the response from the vault service.\
   * @throws Will throw an error if retrieval fails.
   */
  public async getCredential(
    url: string,
    token: string,
    agent: Agent
  ): Promise<VaultReadResponse> {
    try {
      const resp = await axios.get<VaultReadResponse>(url, {
        headers: {
          'content-type': 'application/json',
          'X-Vault-Token': token,
        },
        httpsAgent: agent,
      });
      return resp.data;
    } catch (err: any) {
      const message = err?.response?.data
        ? typeof err.response.data === 'string'
          ? err.response.data
          : JSON.stringify(err.response.data)
        : err?.message ?? 'Unknown error';
      throw new Error(message);
    }
  }

  /**
   * @description Creates or updates credentials by sending a request to an external vault service.
   * @param url - The URL of the external vault service.
   * @param token - The JWT token for authentication.
   * @param agent - The HTTPS agent to use for the request.
   * @param body - The body of the create/update request.
   * @return A promise that resolves when the operation is complete.
   * @throws Will throw an error if the operation fails.
   */
  public async createOrUpdateCredential(
    url: string,
    token: string,
    agent: Agent,
    body: VaultKvWritePayload
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
