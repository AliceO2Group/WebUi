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

import { startTestEnvironment, waitFor } from "./startup";
import { DuplexMessageEvent } from "../wrapper/src/models/message.model";
import { ConnectionStatus } from "../wrapper/src/models/connection.model";
import { CentralSystemWrapper } from "../wrapper/src/central/CentralSystemWrapper";
import { gRPCWrapper } from "../wrapper/src/client/gRPCWrapper";
import { ConnectionManager } from "../wrapper/src/client/ConnectionManager/ConnectionManager";

/**
 * 004 - Token Renew Retry
 * ----------------------------
 * goal: Test that when a token expires, the client requests renewal from Central,
 * Central issues a new token, and the client retries the request successfully.
 */

jest.setTimeout(20000);

describe("004 - Token Renew Retry", () => {
  let env: Awaited<ReturnType<typeof startTestEnvironment>>;
  let stop;
  let renewTokenSpy: jest.SpyInstance;
  let renewTokenCentralSpy: jest.SpyInstance;

  // Observability for central events
  const alerts: Array<any> = [];

  beforeAll(async () => {
    env = await startTestEnvironment();
    stop = env.stop;

    // Wait until both clients are connected to Central
    await waitFor(() => env.central.getConnectedClients().length === 2, 8000);

    // Give clients time to create connections
    await waitFor(
      () =>
        env.wrapperA
          .getAllConnections()
          .sending.some((c) => c.getTargetAddress().includes("40042")) &&
        env.wrapperB
          .getAllConnections()
          .sending.some((c) => c.getTargetAddress().includes("40041")),
      4000
    );

    // Spy on Central's GetAllTokensCommand to monitor renew requests
    renewTokenSpy = jest.spyOn(ConnectionManager.prototype, "renewToken");
    renewTokenCentralSpy = jest.spyOn(TODO RENEW TOKEN HANDLER, "handle");
  });

  it("First try fails with PERMISSION_EXPIRED. A asks Central to renew, Central pushes NEW_TOKEN, retry drains, success 200; B sees two gRPC requests in order (auth-fail, then success via HTTP)", async () => {
    const connAB = env.wrapperA
      .getAllConnections()
      .sending.find((c) => c.getTargetAddress().includes("40042"))!;
    expect(connAB).toBeTruthy();

    // Request that will need renewal; fetch() promise should ultimately resolve to 200
    const fetchPromise = connAB.fetch({
      method: "GET",
      path: "echo",
      headers: { "Content-Type": "application/json" },
    });

    // Wait until B rejects with PERMISSION_EXPIRED. B should send an ALERT to the CentralSystem

    // TODO: DODAWANIE ALERTÓW Z CENTRALI DO TABLICY ALERTS!!!
    await waitFor(
      () =>
        alerts.some(
          (a) =>
            a.event === DuplexMessageEvent.MESSAGE_EVENT_SEND_ALERT &&
            a.payload?.code === "AUTH_PERMISSION_EXPIRED"
        ),
      8000
    );

    // Meanwhile A should have asked for renewal (MESSAGE_EVENT_RENEW_TOKEN)
    expect(renewTokenSpy).toHaveBeenCalled();

    // TODO!!!!!:  Generate a FRESH token for A→B and send MESSAGE_EVENT_NEW_TOKEN to A

    env.central.sendEvent("ADDRESS!!! BY SERIAL NUMBER", {
      event: DuplexMessageEvent.MESSAGE_EVENT_NEW_TOKEN,
      payload: {
        singleToken: {
          token: "", // NEW VALID TOKEN
          targetAddress: "localhost:40042",
          connectionDirection: "SENDING",
        },
      },
    } as any);

    // After NEW_TOKEN, A's RetryQueue.drainNow() should re-execute the request and B should hit /api/echo once
    const res = await fetchPromise;

    // Assertions:
    // 1) Final response OK
    expect(res.status).toBe(200);
    await expect(res).resolves.toEqual({
      message: "Hello from ClientB's local endpoint!",
    });

    // 2) Status transitions on A's connection: TOKEN_REFRESH -> CONNECTED
    expect(connAB.getStatus()).toBe(ConnectionStatus.CONNECTED);

    // 3) Central saw a renew request
    expect(renewTokenCentralSpy).toHaveBeenCalled();
  });
});
