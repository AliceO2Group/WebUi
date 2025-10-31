/**
 * @license
 * Copyright 2019-2020 CERN and copyright holders of ALICE O2.
 * See http://alice-o2.web.cern.ch/copyright for details of the copyright holders.
 * All rights not expressly granted are reserved.
 *
 * This software is distributed under the terms of the GNU General Public
 * License v3 (GPL Version 3), copied verbatim in the file "COPYING".
 *
 * In applying this license CERN does not waive the privileges and immunitie
 * granted to it by virtue of its status as an Intergovernmental Organization
 * or submit itself to any jurisdiction.
 */

import { Command } from "../../models/commands.model.js";
import { DuplexMessageEvent } from "../../models/message.model.js";

/**
 * @description Command used to retrieve all tokens for a client. Handles structure logic.
 */
export class GetAllTokensCommand implements Command {
  readonly event = DuplexMessageEvent.MESSAGE_EVENT_GET_ALL_TOKENS;
  constructor(public payload: any) {}
}
