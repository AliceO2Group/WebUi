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
import type { MessageHandler } from "../../../models/events.model";
import { LogManager } from "@aliceo2/web-ui";

/**
 * @description Dispatches gRPC stream events received from CentralSystem.
 */
export class EventDispatcher implements MessageHandler {
  private logger = LogManager.getLogger("ConnectionManager");

  /**
   * @description Handles incoming events from the gRPC stream.
   *
   * @param event - The event object received from the stream.
   */
  handle(event: any): void {
    switch (event.event) {
      case "EMPTY_EVENT":
        // handle empty event
        break;
      default:
        this.logger.infoMessage("Unknown event type:", event.event);
    }
  }
}
