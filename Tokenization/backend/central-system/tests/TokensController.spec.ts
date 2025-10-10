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

import express from 'express';
import request from 'supertest';
import { ConnectionController } from '../src/controllers/ConnectionController';
import { TokensGetService } from '../src/services/TokensGetService';

// --- Fakes ---
class FakeTokensGetService extends TokensGetService {
  async getTokens(
    tokens: Map<number, { tokenId: number; validity: string; payload: string }>
  ) {
    // without fake delay
    return Array.from(tokens.values()).map((t) => ({
      tokenId: t.tokenId,
      validity: t.validity,
      payload: t.payload.slice(-5),
    }));
  }
}

class FakeWrapper {
  public sent: any[] = [];
  getConnectedClients(): Array<string> {
    return new Array('client-1');
  }
  sendEvent(client: string, payload: any) {
    this.sent.push({ client, payload });
  }
}

// --- Helpers ---
function makeApp(tokensMap?: Map<number, any>) {
  const fakeTokens =
    tokensMap ??
    new Map<number, any>([
      [1, { tokenId: 1, validity: 'good', payload: 'payload1' }],
      [2, { tokenId: 2, validity: 'bad', payload: 'payload2' }],
    ]);

  const wrapper = new FakeWrapper();
  const svc = new FakeTokensGetService();
  const controller = new ConnectionController
(svc, fakeTokens, wrapper as any);

  const app = express();
  app.use(express.json());
  app.get('/tokens-get', controller.getTokensHandler.bind(controller));
  app.post('/tokens/create', controller.createTokenHandler.bind(controller));
  app.post('/tokens/revoke', controller.revokeTokenHandler.bind(controller));
  return { app, wrapper, tokens: fakeTokens };
}

// --- Tests ---

describe('ConnectionController
', () => {
  test('GET /tokens returns transformed tokens', async () => {
    const { app } = makeApp();
    const res = await request(app).get('/tokens-get');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // payload should be truncated to last 5 chars by service
    expect(res.body[0]).toHaveProperty('payload');
    expect(res.body[0].payload.length).toBeLessThanOrEqual(5);
  });

  test('POST /tokens/create validates and creates a token, emits wrapper event', async () => {
    const { app, wrapper, tokens } = makeApp();

    const res = await request(app)
      .post('/tokens/create')
      .send({ payload: 'new-payload-xyz' });

    expect(res.status).toBe(201);

    expect(tokens.size).toBe(3);

    expect(wrapper.sent.length).toBe(1);
    expect(wrapper.sent[0].client).toBe('client-1');
    expect(wrapper.sent[0].payload).toHaveProperty('event');
  });

  test('POST /tokens/create with empty payload -> 400', async () => {
    const { app } = makeApp();

    const res = await request(app).post('/tokens/create').send({ payload: '' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('title', 'Invalid Input');
  });

  test('POST /tokens/revoke deletes token and emits wrapper event', async () => {
    const { app, wrapper, tokens } = makeApp();

    // sanity: token 2 exists
    expect(tokens.has(2)).toBe(true);

    const res = await request(app).post('/tokens/revoke').send({ id: 2 });

    expect(res.status).toBe(204);
    expect(tokens.has(2)).toBe(false);
    // one event sent
    expect(wrapper.sent.length).toBe(1);
    expect(wrapper.sent[0].payload).toHaveProperty('event');
  });

  test('POST /tokens/revoke with non-existing id -> 400', async () => {
    const { app } = makeApp();
    const res = await request(app).post('/tokens/revoke').send({ id: 999 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('title', 'Invalid Input');
  });
});
