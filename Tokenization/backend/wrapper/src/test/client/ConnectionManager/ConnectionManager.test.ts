import * as grpc from "@grpc/grpc-js";
import { ConnectionManager } from "../../../client/ConnectionManager/ConnectionManager";

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

// Mock EventDispatcher
jest.mock(
  "../../../client/ConnectionManager/EventManagement/EventDispatcher",
  () => ({
    EventDispatcher: jest.fn(() => ({
      handle: jest.fn(),
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
    expect(conn).toBeDefined();
    expect(grpc.loadPackageDefinition).toHaveBeenCalled();
    expect(CentralSystemMock).toHaveBeenCalledWith(
      "localhost:12345",
      undefined
    );
  });

  test("connectToCentralSystem() should set up stream listeners", () => {
    conn.connectToCentralSystem();

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

    expect(mockClient.ClientStream).toHaveBeenCalledTimes(2); // initial + reconnect
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
});
