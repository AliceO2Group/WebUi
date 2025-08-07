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
import { NewTokenCommand } from "./newToken.command";
import { ConnectionManager } from "../../ConnectionManager/ConnectionManager";
import { ConnectionDirection } from "../../../models/message.model";

export class NewTokenHandler implements CommandHandler<NewTokenCommand> {
  constructor(private manager: ConnectionManager) {}

  async handle(command: NewTokenCommand): Promise<void> {
    const { targetAddress, connectionDirection, token } = command.payload || {};
    if (!targetAddress || !token || !connectionDirection) {
      throw new Error(
        "Insufficient arguments. Expected: targetAddress, connectionDirection, token."
      );
    }

    const directions =
      connectionDirection === ConnectionDirection.DUPLEX
        ? [ConnectionDirection.SENDING, ConnectionDirection.RECEIVING]
        : [connectionDirection];

    for (const dir of directions) {
      let conn = this.manager.getConnectionByAddress(targetAddress, dir);
      if (!conn) {
        conn = this.manager.createNewConnection(targetAddress, dir, token);
      }
      conn.handleNewToken(token);
    }
  }
}
