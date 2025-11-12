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

import { LogManager } from "@aliceo2/web-ui";
import { Command, CommandHandler } from "models/commands.model";
import { DuplexMessageEvent } from "../../../models/message.model";

export class CentralCommandDispatcher {
  private handlers = new Map<DuplexMessageEvent, CommandHandler>();
  private logger = LogManager.getLogger("CentralCommandDispatcher");

  register<T extends Command>(
    event: DuplexMessageEvent,
    handler: CommandHandler<T>
  ): void {
    console.log(`Registering handler for command type: ${event}`);
    this.handlers.set(event, handler);
  }

  async dispatch(command: Command): Promise<void> {
    const handler = this.handlers.get(command.event);
    this.logger.debugMessage(`Dispatching command: ${command.event}`);
    if (!handler) {
      this.logger.warnMessage(
        `No handler registered for command type: ${command.event}`
      );
      return;
    }

    try {
      await handler.handle(command);
    } catch (error) {
      this.logger.errorMessage(
        `Error handling command ${command.event}:`,
        error
      );
    }
  }
}
