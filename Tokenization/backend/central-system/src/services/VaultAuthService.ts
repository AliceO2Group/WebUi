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

import { AuthResponse } from '../types/vault_types';
import { VaultLoginPayload } from '../types/vault_types';

/**
 * @description Service for authenticating with an external vault service.
 */
export class VaultAuthService {
  /**
   * @description Logs in to the vault service and retrieves a client token.
   * @param url - The URL of the external vault service.
   * @param agent - The HTTPS agent to use for the request.
   * @param body - The body of the login request.
   * @return A promise that resolves to the client token.
   * @throws Will throw an error if the login fails.
   */
  public async login(
    url: string,
    agent: Agent,
    body: VaultLoginPayload
  ): Promise<string> {
    try {
      const resp = await axios.post<AuthResponse>(url, body, {
        headers: { 'content-type': 'application/json' },
        httpsAgent: agent,
      });
      return resp.data.auth.client_token;
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
   * @description Renews the client token by sending a request to the vault service.
   * @param url - The URL of the external vault service.
   * @param token - The current client token.
   * @param agent - The HTTPS agent to use for the request.
   * @param body - The body of the renew request.
   * @return A promise that resolves to the new client token.
   * @throws Will throw an error if the renew fails.
   */
  public async renew(
    url: string,
    token: string,
    agent: Agent,
    body: null
  ): Promise<string> {
    try {
      const resp = await axios.post<AuthResponse>(url, body, {
        headers: {
          'content-type': 'application/json',
          'X-Vault-Token': token,
        },
        httpsAgent: agent,
      });
      return resp.data.auth.client_token;
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
