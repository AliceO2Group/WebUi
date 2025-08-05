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
import { CommandHandler } from "../../models/commands.model";
import { RevokeTokenCommand } from "./revokeToken.command";
import { ConnectionManager } from "../ConnectionManager/ConnectionManager";

export class RevokeTokenHandler implements CommandHandler<RevokeTokenCommand> {
  constructor(private manager: ConnectionManager) {}

  async handle(command: RevokeTokenCommand): Promise<void> {
    const { targetAddress } = command.payload || {};
    if (!targetAddress) {
      throw new Error("Target address is required to revoke token.");
    }

    const conn = this.manager.getConnectionByAddress(targetAddress);
    conn?.handleRevokeToken();
  }
}
