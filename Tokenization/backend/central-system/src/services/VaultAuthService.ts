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
import fetch from 'node-fetch';

// Define the structure of the login response
interface AuthResponse {
  auth: {
    client_token: string;
  };
}

/**
 * @description Service for authenticating with an external vault service.
 */
export class VaultAuthService {
  public async login(
    url: string,
    agent: Agent,
    body: Buffer | string | NodeJS.ReadableStream | null
  ): Promise<string> {
    const result = await fetch(url, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
    const data = (await result.json()) as AuthResponse;
    return data.auth.client_token;
  }

  /**
   * @description Renews the client token by sending a request to the vault service.
   * @param url - The URL of the external vault service.
   * @param token - The current client token.
   * @param agent - The HTTPS agent to use for the request.
   * @param body - The body of the renew request.
   * @return A promise that resolves to the new client token.
   */
  public async renew(
    url: string,
    token: string,
    agent: Agent,
    body: Buffer | string | NodeJS.ReadableStream | null
  ): Promise<string> {
    const result = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json',
        'X-Vault-Token': token,
      },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
    const data = (await result.json()) as AuthResponse;
    return data.auth.client_token;
  }
}
