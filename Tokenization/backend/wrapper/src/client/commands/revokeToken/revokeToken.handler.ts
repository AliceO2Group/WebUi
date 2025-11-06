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

import { CommandHandler } from "../../../models/commands.model";
import { RevokeTokenCommand } from "./revokeToken.command";
import { ConnectionManager } from "../../ConnectionManager/ConnectionManager";

/**
 * RevokeTokenHandler is responsible for handling the RevokeTokenCommand.
 * It retrieves the target connection using the provided address and direction,
 * and calls `handleRevokeToken()` on that connection if it exists.
 */
export class RevokeTokenHandler implements CommandHandler<RevokeTokenCommand> {
  /**
   * Creates a new instance of RevokeTokenHandler.
   *
   * @param manager - The ConnectionManager used to retrieve active connections.
   */
  constructor(private manager: ConnectionManager) {}

  /**
   * Handles the RevokeTokenCommand by revoking the token on the target connection.
   *
   * @param command - The RevokeTokenCommand containing the target address and direction.
   * @throws Will throw an error if the target address is missing in the command payload.
   */
  async handle(command: RevokeTokenCommand): Promise<void> {
    const { targetAddress } = command.payload || {};
    if (!targetAddress) {
      throw new Error("Target address is required to revoke token.");
    }

    const conn = this.manager.getConnectionByAddress(
      targetAddress,
      command.payload.connectionDirection
    );

    conn?.handleRevokeToken();
  }
}
