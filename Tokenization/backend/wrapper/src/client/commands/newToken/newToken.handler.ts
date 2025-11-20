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

import type { CommandHandler } from '../../../models/commands.model';
import type { NewTokenCommand } from './newToken.command';
import type { ConnectionManager } from '../../ConnectionManager/ConnectionManager';
import { ConnectionDirection } from '../../../models/message.model';

/**
 * @description Handles the NewTokenCommand by updating or creating a connection with a new authentication token.
 */
export class NewTokenHandler implements CommandHandler<NewTokenCommand> {
  /**
   * Constructor for NewTokenHandler.
   *
   * @param manager - The ConnectionManager instance to manage connections.
   */
  constructor(private manager: ConnectionManager) {}

  /**
   * Processes the NewTokenCommand by assigning a new token to the specified connection.
   * If the connection does not exist, it is created.
   *
   * @param command - The new token event command.
   * @throws Will throw an error if any of the required payload fields are missing.
   */
  async handle(command: NewTokenCommand): Promise<void> {
    const { targetAddress, connectionDirection, token } = command.payload || {};
    if (!targetAddress || !token || !connectionDirection) {
      throw new Error('Insufficient arguments. Expected: targetAddress, connectionDirection, token.');
    }

    const directions =
      connectionDirection === ConnectionDirection.DUPLEX ? [ConnectionDirection.SENDING, ConnectionDirection.RECEIVING] : [connectionDirection];

    for (const dir of directions) {
      let conn = this.manager.getConnectionByAddress(targetAddress, dir);
      conn ??= await this.manager.createNewConnection(targetAddress, dir, token);
      conn.token = token;
    }
  }
}
