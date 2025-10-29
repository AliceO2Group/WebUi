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

import {bus} from "./event-bus.js";

// Generic handler type
type Handler<TPayload, TResult = any> = (payload: TPayload) => Promise<TResult>;

/**
 * @description Registers a handler for a specific event on the event bus.
 * The handler processes incoming requests and sends back responses or errors.
 * @param event - The name of the event to listen for.
 * @param handler - The async function that processes the event payload and returns a result.
 */

function registerBusHandler<TPayload, TResult = any>(
  event: string,
  handler: Handler<TPayload, TResult>
) {
  bus.on(event, async ({ id, replyEvent, payload }: { id: string; replyEvent: string; payload: TPayload }) => {
    try {
      const data = await handler(payload);
      bus.emit(replyEvent, { ok: true as const, data });
    } catch (err: any) {
      bus.emit(replyEvent, {
        ok: false as const,
        error: {
          message: err?.message ?? "Unknown error",
          code: err?.code,
          stack: err?.stack,
        },
      });
    }
  });
}

export { registerBusHandler };