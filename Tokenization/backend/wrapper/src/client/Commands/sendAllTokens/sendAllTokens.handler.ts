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
import { SendAllTokensCommand } from "./sendAllTokens.command";
import { ConnectionManager } from "../../ConnectionManager/ConnectionManager";
import { ConnectionDirection } from "../../../models/message.model";

export class SendAllTokensHandler
  implements CommandHandler<SendAllTokensCommand>
{
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
   * @throws Will throw an error if the target address or direction is missing in the command payload.
   */
  async handle(command: SendAllTokensCommand): Promise<void> {
    const { tokensList } = command.payload;

    for (const token of tokensList) {
      this.manager.createNewConnection(
        token.targetAddress,
        token.connectionDirection || ConnectionDirection.SENDING,
        token.token || ""
      );
    }
  }
}
