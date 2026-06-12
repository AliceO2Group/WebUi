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

import type { Command } from '../../../models/commands.model';
import type { TokenMessage } from '../../../models/message.model';
import { DuplexMessageEvent } from '../../../models/message.model';

/**
 * @description Command used to trigger token revocation for a specific connection. Handles structure logic.
 */
export class RevokeTokenCommand implements Command {
  readonly event = DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN;
  /**
   * Constructor for RevokeTokenCommand.
   * @param {TokenMessage} payload - TokenMessage containing the address and direction of the connection to be revoked.
   */
  constructor(public payload: TokenMessage) {}
}
