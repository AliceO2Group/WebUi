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

import { bus } from './event-bus';
import { randomUUID } from 'node:crypto';

// Error structure for RPC failures
export type RpcError = { message: string; code?: string; stack?: string };

// Custom Error class to include code and stack
export class RpcCustomError extends Error {
  code?: string;
  override stack?: string;
  constructor(message: string, code?: string, stack?: string) {
    super(message);
    this.name = 'RpcCustomError';
    this.code = code;
    if (stack) this.stack = stack;
  }
}

// Payload structure for emitted events
interface RpcEventPayload<Req> {
  id: string;
  replyEvent: string;
  payload: Req;
}

/**
 * @description Emits an event on the bus and waits for a corresponding reply event.
 * The function generates a unique ID for the request, listens for the reply,
 * and resolves or rejects based on the response received.
 * @param baseEvent - The base name of the event to emit.
 * @param payload - The payload to send with the event.
 * @param timeoutMs - Optional timeout in milliseconds to wait for a reply (default is 10 seconds).
 * @returns A promise that resolves with the response data or rejects with an error.
 * @throws Will throw an error if the timeout is reached or if the response indicates a failure.
 */
export async function emitAndWait<Req, Res>(
  baseEvent: string,
  payload: Req,
  { timeoutMs = 10_000 }: { timeoutMs?: number } = {}
): Promise<Res> {
  const id = randomUUID();
  const replyEvent = `${baseEvent}:REPLY:${id}`;

  return new Promise<Res>((resolve, reject) => {
    const onReply = (msg: { ok: true; data: Res } | { ok: false; error: RpcError }) => {
      clearTimeout(timer);
      bus.off(replyEvent, onReply);
      if (msg.ok) resolve(msg.data);
      else reject(new RpcCustomError(msg.error.message, msg.error.code, msg.error.stack));
    };

    const timer = setTimeout(() => {
      bus.off(replyEvent, onReply);
      reject(new Error(`RPC timeout waiting for ${replyEvent}`));
    }, timeoutMs);

    bus.on(replyEvent, onReply);
    const eventPayload: RpcEventPayload<Req> = { id, replyEvent, payload };
    bus.emit(baseEvent, eventPayload);
  });
}
