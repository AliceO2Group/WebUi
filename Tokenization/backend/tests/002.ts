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

/**
 * 002 - token distribution
 * ----------------------------------------
 * Goal: CentralSystem distributes tokens to Client A and Client B
 *     after their initial connection. CentralSystem handles getting all tokens requests.
 */

import { startTestEnvironment, waitFor } from "./startup";
import { DuplexMessageEvent } from "../wrapper/src/models/message.model";

jest.setTimeout(20000);

describe("002 - Token distribution; get all tokens", () => {
  let env: Awaited<ReturnType<typeof startTestEnvironment>>;
  let stop;

  // spy on getAllTokens handler for CentralSystem to see if it has been called
  let getAllTokensHandler: (event: DuplexMessageEvent) => void = jest.spyOn();

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
  });

  it("Both clients should have created connections to each other and have status CONNECTED", () => {
    const aToB = env.wrapperA
      .getAllConnections()
      .sending.find((c) => c.getTargetAddress().includes("40042"));
    const bToA = env.wrapperB
      .getAllConnections()
      .sending.find((c) => c.getTargetAddress().includes("40041"));

    expect(aToB).toBeTruthy();
    expect(bToA).toBeTruthy();
    expect(aToB!.getStatus()).toBe("CONNECTED");
    expect(bToA!.getStatus()).toBe("CONNECTED");
  });

  it('CentralSystem should have handled "getAllTokens" requests from both clients', async () => {
    expect(getAllTokensHandler).toHaveBeenCalledTimes(2);
  });
});
