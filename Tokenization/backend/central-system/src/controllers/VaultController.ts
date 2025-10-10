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

import { VaultSignService } from "../services/VaultSignService";

/**
 * @description Controller for managing interactions with the Vault service.
 */
export class VaultController {
  /**
   * @description Initializes the VaultController with a VaultSignService instance.
   * @param tokenSignService - An instance of VaultSignService to handle token signing.
   */
  constructor(private readonly tokenSignService: VaultSignService) {}

  /**
   * @description Signs a token using the VaultSignService.
   * @param tokenJWT - The JWT token to be signed.
   * @param url - The URL of the external vault service.
   * @return A promise that resolves to the response from the vault service.
   */
  public async signToken(tokenJWT: string, url: string) {
    return this.tokenSignService.signToken(tokenJWT, url);
  }
}
