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

/**
 * CentralCommandDispatcher is responsible for registering and dispatching command handlers
 * based on the command's event type. It acts as the central hub for routing incoming
 * command messages coming from central system to the appropriate handler functions.
 */
export class CentralCommandDispatcher {
  private _handlers = new Map<DuplexMessageEvent, CommandHandler>();
  private _logger = LogManager.getLogger("CentralCommandDispatcher");

  /**
   * Registers a command handler for a specific command event type.
   *
   * @param event - The event type of the command to be handled.
   * @param handler - The handler that should process commands of the given event type.
   */
  register<T extends Command>(
    event: DuplexMessageEvent,
    handler: CommandHandler<T>
  ): void {
    this._logger.infoMessage(`Registering handler for command type: ${event}`);
    this._handlers.set(event, handler);
  }

  /**
   * Dispatches a command to the appropriate registered handler based on its event type.
   * Logs warnings if no handler is found, and catches/logs errors during handler execution.
   *
   * @param command - The command object containing an event and its associated payload.
   */
  async dispatch(command: Command): Promise<void> {
    const handler = this._handlers.get(command.event);
    this._logger.debugMessage(`Dispatching command: ${command.event}`);
    if (!handler) {
      this._logger.warnMessage(
        `No handler registered for command type: ${command.event}`
      );
      return;
    }

    try {
      await handler.handle(command);
    } catch (error) {
      this._logger.errorMessage(
        `Error handling command ${command.event}:`,
        error
      );
    }
  }
}
