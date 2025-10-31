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
import { GRPCAuthInterceptor } from "../wrapper/src/client/ConnectionManager/Interceptors/grpc.auth.interceptor";
import { Connection } from "../wrapper/src/client/Connection/Connection";
import { ConnectionManager } from "../wrapper/src/client/ConnectionManager/ConnectionManager";

/**
 * 003 - A -> B fetch success (with mocked crypto)
 * ----------------------------------------
 * Goal: ClientA should sent via RPC tunnel HTTP-like request to ClientB,
 * Client B's AuthInterceptor should allow it,
 * which delegates request to local endpoint and returns API response.
 */

jest.setTimeout(30000);

describe("003 - Fetching data from local endpoint", () => {
  let stop: () => Promise<void>;
  let env: Awaited<ReturnType<typeof startTestEnvironment>>;
  let authInterceptorSpy: jest.SpyInstance;
  const httpRequest = {
    path: "echo",
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  };

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

    authInterceptorSpy = jest.spyOn(GRPCAuthInterceptor.prototype, "validate");
  });

  it("Should successfully fetch data from ClientB's local endpoint via RPC tunnel", async () => {
    // get connection from A to B
    const connectionToB: Connection =
      env.wrapperA.getAllConnections().sending[0];

    // ClientA makes the request to ClientB via RPC tunnel
    await connectionToB.fetch(httpRequest).then((response) => {
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Hello from ClientB's local endpoint!",
      });
    });

    // ClientB's AuthInterceptor should have received the request
    expect(authInterceptorSpy).toHaveBeenCalledTimes(1);

    // Client B should have received the correct request structure
    expect(
      (authInterceptorSpy.mock.calls[0][0] as any)?.request
    ).toEqual(httpRequest);
  });
});
