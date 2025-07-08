import { serializeRequest } from "../../utils/serialization.utils";
// 1. describe(), test(), it()
// test suite "Basic Jest methods"
describe("Basic Jest methods", () => {
  test("adds numbers correctly", () => {
    expect(1 + 2).toBe(3);
  });

  it("subtracts numbers correctly", () => {
    expect(5 - 2).toBe(3);
  });
});

// 2. expect() + matchers
describe("expect + matchers", () => {
  it("should present expect + matchers methods", () => {
    expect(2 + 2).toBe(4); // strict equality
    expect([1, 2]).toEqual([1, 2]); // deep equality for arrays
    expect("hello world").toContain("hello");
    expect(() => JSON.parse("{")).toThrow(); // expects function to throw error
  });

  const add = (a, b) => {
    return a + b;
  };
  it.each([
    [1, 1, 2],
    [2, 2, 4],
    [1, 2, 3],
  ])("should correctly add numbers", (a, b, result) => {
    expect(add(a, b)).toBe(result);
  });
});

// 3. Mocking + SpyOn

// SpyOn
class importedClass {
  constructor() {}

  private testFunc = () => {
    return "hello from test";
  };

  public test() {
    return this.testFunc();
  }
}

// mock
jest.mock("../serialization.utils.ts", () => ({
  serializeRequest: jest.fn().mockResolvedValue("Hi"),
}));

describe("Mocking + SpyOn", () => {
  const testClass = new importedClass();
  const spy = jest.spyOn(testClass as any, "testFunc");

  it("should mock return value of serializeRequest", async () => {
    const result = await serializeRequest("/test", {});
    expect(result).toEqual("Hi");
  });

  it("testFuncCall should be executed with spyon mock", () => {
    expect(testClass.test()).toEqual("hello from test");
    spy.mockReturnValue("Hi");
    expect(testClass.test()).toEqual("Hi");
    expect(spy).toHaveBeenCalled();
  });
});

// 4. Resets and cleanups
describe("Resets + mocks", () => {
  it("should not call mock after cleanup", () => {
    const mock = jest.fn();
    mock();
    jest.clearAllMocks();
    expect(mock).not.toHaveBeenCalled();
  });

  it("should restore mocks", () => {
    const obj = {
      greet: () => "hi",
    };

    jest.spyOn(obj, "greet").mockImplementation(() => "mock");
    jest.restoreAllMocks();
    expect(obj.greet()).toBe("hi");
  });
});

// 5. beforeEach
const mockFn = jest.fn();

describe("mockFn test suite", () => {
  beforeEach(() => {
    mockFn.mockClear();
  });

  test("mockFn is called once", () => {
    mockFn();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  test("mockFn is clean before this test", () => {
    expect(mockFn).not.toHaveBeenCalled();
  });
});

//
//
// ConnectionManager.test.ts

jest.mock("@grpc/grpc-js", () => ({
  credentials: { createInsecure: jest.fn() },
  loadPackageDefinition: jest.fn(),
}));

jest.mock("@grpc/proto-loader", () => ({
  loadSync: jest.fn(() => ({})),
}));

import * as grpc from "@grpc/grpc-js";
import { ConnectionManager } from "../../client/ConnectionManager/ConnectionManager";

describe("ConnectionManager", () => {
  let connectionManager: ConnectionManager;
  const fakeStream = {
    on: jest.fn(),
    end: jest.fn(),
  };

  beforeAll(() => {
    const fakeWrapper = {
      CentralSystem: jest.fn().mockImplementation(() => ({
        ClientStream: jest.fn(() => fakeStream),
      })),
    };

    (grpc.loadPackageDefinition as jest.Mock).mockReturnValue({
      wrapper: fakeWrapper,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    connectionManager = new ConnectionManager(
      "./proto/wrapper.proto",
      "localhost:50051"
    );
    (connectionManager as any).client = {
      ClientStream: jest.fn(() => fakeStream),
    };

    (connectionManager as any).scheduleReconnect = jest.fn();
  });

  it("should correctly set up data listener on ClientStream", () => {
    connectionManager.connectToCentralSystem();
    expect(fakeStream.on).toHaveBeenCalledWith("data", expect.any(Function));
  });

  it("should warn and reset stream on end event", () => {
    connectionManager.connectToCentralSystem();
    const endHandler = fakeStream.on.mock.calls.find(
      ([event]) => event === "end"
    )![1];
    endHandler();
    expect((connectionManager as any).scheduleReconnect).toHaveBeenCalled();
  });

  it("should handle error event and reset stream", () => {
    connectionManager.connectToCentralSystem();
    const errorHandler = fakeStream.on.mock.calls.find(
      ([event]) => event === "error"
    )![1];
    errorHandler(new Error("test error"));
    expect((connectionManager as any).scheduleReconnect).toHaveBeenCalled();
  });
});
