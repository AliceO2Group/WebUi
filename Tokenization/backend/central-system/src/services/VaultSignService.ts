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

/**
 * @description Service for signing tokens using an external vault service.
 */
export class VaultSignService {
  /**
   * @description Signs a token by sending it to an external vault service.
   * @param tokenJWT - The JWT token to be signed.
   * @param url - The URL of the external vault service.
   * @return A promise that resolves to the response from the vault service.
   */
  public async signToken(tokenJWT: string, url: string) {
    return await fetch(url, {
      method: "POST",
      headers: {
        "X-Vault-Token": "xyz",
        input: tokenJWT,
        marshaling_algorithm: "jws",
      },
    });
  }
}
