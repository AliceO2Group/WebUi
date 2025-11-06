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

import * as grpc from "@grpc/grpc-js";
import { ConnectionManager } from "../../../client/connectionManager/ConnectionManager";
import { DuplexMessageEvent } from "../../../models/message.model";

// Mock duplex stream
const mockStream = {
  on: jest.fn(),
  end: jest.fn(),
};

// Mock gRPC client
const mockClient = {
  ClientStream: jest.fn(() => mockStream),
};

// Mock CentralSystem constructor
const CentralSystemMock = jest.fn(() => mockClient);

// Mock dispatcher
const mockDispatch = jest.fn();
jest.mock(
  "../../../client/ConnectionManager/EventManagement/CentralCommandDispatcher",
  () => ({
    CentralCommandDispatcher: jest.fn(() => ({
      dispatch: mockDispatch,
    })),
  })
);

// Mock logger
jest.mock("@aliceo2/web-ui", () => ({
  LogManager: {
    getLogger: () => ({
      infoMessage: jest.fn(),
    }),
  },
}));

// Mock gRPC proto loader and client
jest.mock("@grpc/proto-loader", () => ({
  loadSync: jest.fn(() => {
    return {};
  }),
}));

jest.mock("@grpc/grpc-js", () => {
  const original = jest.requireActual("@grpc/grpc-js");
  return {
    ...original,
    credentials: {
      createInsecure: jest.fn(),
    },
    loadPackageDefinition: jest.fn(() => ({
      webui: {
        tokenization: {
          CentralSystem: CentralSystemMock,
        },
      },
    })),
  };
});

describe("ConnectionManager", () => {
  let conn: ConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    conn = new ConnectionManager("dummy.proto", "localhost:12345");
  });

  test("should initialize client with correct address", () => {
    const connManager = new ConnectionManager("dummy.proto", "localhost:12345");
    expect(connManager).toBeDefined();
    expect(grpc.loadPackageDefinition).toHaveBeenCalled();
    expect(CentralSystemMock).toHaveBeenCalledWith(
      "localhost:12345",
      undefined
    );
  });

  test("connectToCentralSystem() should set up stream listeners", () => {
    const connManager = new ConnectionManager("dummy.proto", "localhost:12345");
    connManager.connectToCentralSystem();

    expect(mockClient.ClientStream).toHaveBeenCalled();
    expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  test("disconnectFromCentralSystem() should end stream", () => {
    conn.connectToCentralSystem();
    conn.disconnectFromCentralSystem();

    expect(mockStream.end).toHaveBeenCalled();
  });

  test("should reconnect on stream 'end'", () => {
    jest.useFakeTimers();
    conn.connectToCentralSystem();
    const onEnd = mockStream.on.mock.calls.find(
      ([event]) => event === "end"
    )?.[1];

    onEnd?.(); // simulate 'end'
    jest.advanceTimersByTime(2000);

    expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test("should reconnect on stream 'error'", () => {
    jest.useFakeTimers();
    conn.connectToCentralSystem();
    const onError = mockStream.on.mock.calls.find(
      ([event]) => event === "error"
    )?.[1];

    onError?.(new Error("Simulated error"));
    jest.advanceTimersByTime(2000);

    expect(mockClient.ClientStream).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test("should dispatch event when 'data' is received", () => {
    conn.connectToCentralSystem();
    const onData = mockStream.on.mock.calls.find(
      ([event]) => event === "data"
    )?.[1];

    const mockMessage = {
      event: DuplexMessageEvent.MESSAGE_EVENT_REVOKE_TOKEN,
      data: {
        revokeToken: {
          token: "abc123",
          targetAddress: "peer-123",
        },
      },
    };

    onData?.(mockMessage);

    expect(mockDispatch).toHaveBeenCalledWith(mockMessage);
  });
});
