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

/**
 * 001 - bootstrap (Central + Client A + Client B)
 * ----------------------------------------
 * Goal: Verify that CentralSystem starts and two clients connect to it.
 */

jest.setTimeout(20000); // timeout for tests to start

describe("001 - bootstrap (Central + Client A + Client B)", () => {
  let env: Awaited<ReturnType<typeof startTestEnvironment>>;
  let stop: () => Promise<void>;
  let getConnected: () => string[];

  beforeAll(async () => {
    env = await startTestEnvironment();
    stop = env.stop;
    getConnected = () => env.central.getConnectedClients();
  });

  it("CentralSystem should have two connected clients", async () => {
    env.wrapperA.connectToCentralSystem();
    env.wrapperB.connectToCentralSystem();

    await waitFor(() => getConnected().length === 2);
    const clients = getConnected();
    expect(Array.isArray(clients)).toBe(true);
    expect(clients.length).toBe(2);
  });
});
