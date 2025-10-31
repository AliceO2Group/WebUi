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

import { CommandHandler } from "../../models/commands.model.js";
import { RenewTokenCommand } from "./renewToken.command.js";
import { CentralSystemWrapper } from "../../CentralSystemWrapper.js";


/** * @description Command handler used to renew token for a client after its expiration. Handles logic.
 */
export class RenewTokenHandler implements CommandHandler<RenewTokenCommand> {
    /**
     * @param getNewToken - Function to get a new token for the client.
     * @param _centralSystemWrapper - Instance of CentralSystemWrapper.
     */
  constructor(
    private getNewToken: (
      clientSerialNumber: string,
      targetAddress: string,
      centralSystemWrapper: CentralSystemWrapper
    ) => Promise<void>,
    private _centralSystemWrapper: CentralSystemWrapper
  ) {
    this.getNewToken = getNewToken;
  }

  /**
   * @description Handles the RenewTokenCommand by invoking the getNewToken function.
   * @param command The RenewTokenCommand containing the token renewal payload.
   */
  public async handle(
    command: RenewTokenCommand & { clientSerialNumber?: string }
  ): Promise<void> {
    await this.getNewToken(
      command.clientSerialNumber as string,
      command.payload.singleToken.targetAddress,
      this._centralSystemWrapper
    );
  }
}
