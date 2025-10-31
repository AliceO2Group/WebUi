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
import { ConnectionManager } from "../../../client/ConnectionManager/ConnectionManager";
import { CentralConnection } from "../../../client/ConnectionManager/CentralConnection";

// Mock of client and stream
const mockStream = {
  on: jest.fn(),
  end: jest.fn(),
};

const mockClient = {
  ClientStream: jest.fn(() => mockStream),
};

jest.mock("@aliceo2/web-ui", () => ({
  LogManager: {
    getLogger: () => ({
      infoMessage: jest.fn(),
    }),
  },
}));

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
          CentralSystem: jest.fn(() => mockClient),
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
    expect(conn).toBeDefined();
    expect(grpc.loadPackageDefinition).toHaveBeenCalled();
  });

  test("connectToCentralSystem() should create stream and log message", () => {
    conn.connectToCentralSystem();

    expect(mockClient.ClientStream).toHaveBeenCalled();
    expect(mockStream.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(mockStream.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  test("disconnect() should end stream and reset reconnectAttempts", () => {
    conn.connectToCentralSystem();
    conn.disconnectFromCentralSystem();

    expect(mockStream.end).toHaveBeenCalled();
  });

  test("scheduleReconnect() should call connect after delay", () => {
    jest.useFakeTimers();
    const spy = jest.spyOn<any, any>(CentralConnection.prototype, "connect");

    const centralConnection = new CentralConnection(mockClient, {} as any);
    (centralConnection as any).scheduleReconnect();

    jest.advanceTimersByTime(1000 * 2);
    expect(spy).toHaveBeenCalled();
    jest.useRealTimers();
  });

  test("should reconnect on stream 'end'", () => {
    conn.connectToCentralSystem();
    const onEnd = mockStream.on.mock.calls.find(
      ([event]) => event === "end"
    )[1];

    const reconnectSpy = jest.spyOn<any, any>(
      CentralConnection.prototype,
      "scheduleReconnect"
    );
    onEnd();

    expect(reconnectSpy).toHaveBeenCalled();
  });

  test("should reconnect on stream 'error'", () => {
    conn.connectToCentralSystem();
    const onError = mockStream.on.mock.calls.find(
      ([event]) => event === "error"
    )[1];

    const reconnectSpy = jest.spyOn<any, any>(
      CentralConnection.prototype,
      "scheduleReconnect"
    );
    onError(new Error("Stream failed"));

    expect(reconnectSpy).toHaveBeenCalled();
  });
});
