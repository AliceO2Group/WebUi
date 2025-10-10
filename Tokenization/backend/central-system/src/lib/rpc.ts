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

export type RpcError = { message: string; code?: string; stack?: string };

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

interface RpcEventPayload<Req> {
  id: string;
  replyEvent: string;
  payload: Req;
}

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
