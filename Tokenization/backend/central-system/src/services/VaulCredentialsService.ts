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

import { Agent } from "https";
import fetch from "node-fetch";

// Define the structure of the Get Credential response
interface GetResponse {
  data: { data: any };
}

/**
 * * @description Service for retrieving credentials from an external vault service.
 */
export class VaultCredentialsService {
  /**
   * @description Retrieves credentials by sending a request to an external vault service.
   * @param url - The URL of the external vault service.
   * @return A promise that resolves to the response from the vault service.
   */
  public async getCredential(
    url: string,
    token: string,
    agent: Agent
  ): Promise<any> {
    const result = await fetch(url, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        "X-Vault-Token": token,
      },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
    const resJSON = (await result.json()) as GetResponse;
    return resJSON.data.data;
  }

  public async createOrUpdateCredential(
    url: string,
    token: string,
    agent: Agent,
    body: Buffer | string | NodeJS.ReadableStream | null
  ): Promise<void> {
    const result = await fetch(url, {
      method: "POST",
      body,
      headers: {
        "content-type": "application/json",
        "X-Vault-Token": token,
      },
      agent,
    });
    if (!result.ok) throw new Error(await result.text());
  }
}
