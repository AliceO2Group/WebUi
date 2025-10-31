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
import { SendAlertCommand } from "./sendAlert.command.js";
import { LogManager } from "@aliceo2/web-ui";

/**
 * @description Handler for SendAlertCommand. Logs alerts sent by clients.
 */
export class sendAlertHandler implements CommandHandler<SendAlertCommand> {
  private _logger = LogManager.getLogger("ClientAlert");

  public constructor() {
  }

  /**
   * @description Handles the SendAlertCommand by logging the alert details.
   * @param command The SendAlertCommand containing the alert payload.
   */
  public async handle(command: SendAlertCommand): Promise<void> {
    this._logger.warnMessage(
      `ALERT from client: ${JSON.stringify((command as any).clientSerialNumber)}`
    );

    this._logger.warnMessage(
      `ALERT details: ${JSON.stringify(command.payload)}`
    );
    
  }
}
