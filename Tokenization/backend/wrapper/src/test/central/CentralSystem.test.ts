const mockAddService = jest.fn();
const mockBindAsync = jest.fn();
const mockServerInstance = {
  addService: mockAddService,
  bindAsync: mockBindAsync,
};

const logger = {
  infoMessage: jest.fn(),
};

jest.mock("@aliceo2/web-ui", () => ({
  LogManager: {
    getLogger: () => logger,
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
    Server: jest.fn(() => mockServerInstance),
    ServerCredentials: {
      createInsecure: jest.fn(() => "mock-credentials"),
    },
    loadPackageDefinition: jest.fn(() => ({
      webui: {
        tokenization: {
          CentralSystem: {
            service: "mock-service",
          },
        },
      },
    })),
  };
});

import { CentralSystemWrapper } from "../../central/CentralSystem";
import * as grpc from "@grpc/grpc-js";

describe("CentralSystemWrapper", () => {
  let wrapper: CentralSystemWrapper;

  beforeEach(() => {
    jest.clearAllMocks();
    wrapper = new CentralSystemWrapper("dummy.proto", 12345);
  });

  test("should set up gRPC service and add it to the server", () => {
    expect(grpc.Server).toHaveBeenCalled();
    expect(grpc.loadPackageDefinition).toHaveBeenCalled();
    expect(grpc.ServerCredentials.createInsecure).not.toHaveBeenCalled();
    expect(wrapper).toBeDefined();
  });

  test("should call listen and bind the server", () => {
    mockBindAsync.mockImplementation((_addr, _creds, cb) => cb(null, 12345));

    wrapper.listen();

    expect(mockBindAsync).toHaveBeenCalledWith(
      "localhost:12345",
      "mock-credentials",
      expect.any(Function)
    );
  });

  test("should log error if bind fails", () => {
    const error = new Error("bind failed");
    mockBindAsync.mockImplementation((_addr, _creds, cb) => cb(error, null));

    wrapper.listen();

    expect(logger.infoMessage).toHaveBeenCalledWith(
      "Server bind error:",
      error
    );
  });

  test("should handle client stream events", () => {
    const logger = require("@aliceo2/web-ui").LogManager.getLogger();

    const mockCall = {
      getPeer: jest.fn(() => "client123"),
      on: jest.fn((event, cb) => {
        if (event === "end") cb();
        if (event === "error") cb(new Error("stream error"));
      }),
      end: jest.fn(),
    };

    const handler = (wrapper as any).clientStreamHandler.bind(wrapper);
    handler(mockCall);

    expect(mockCall.on).toHaveBeenCalledWith("data", expect.any(Function));
    expect(mockCall.on).toHaveBeenCalledWith("end", expect.any(Function));
    expect(mockCall.on).toHaveBeenCalledWith("error", expect.any(Function));

    expect(mockCall.end).toHaveBeenCalled();
    expect(logger.infoMessage).toHaveBeenCalledWith(
      "Client client123 connected to CentralSystem stream stream"
    );
    expect(logger.infoMessage).toHaveBeenCalledWith(
      "Client client123 ended stream."
    );
    expect(logger.infoMessage).toHaveBeenCalledWith(
      "Stream error from client client123:",
      expect.any(Error)
    );
  });
});
