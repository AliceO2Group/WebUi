import { deserializeRequest, serializeRequest } from "../serialization.utils";
import { describe, expect, test } from "@jest/globals";

describe("serializeRequest", () => {
  test("serializes URL and options correctly", () => {
    const url = "/api/test";
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    };

    const buffer = serializeRequest(url, options);
    const view = new Uint8Array(buffer);

    const typeLength = view[0];
    const typeBytes = view.slice(1, 1 + typeLength);
    const jsonBytes = view.slice(1 + typeLength);

    const contentType = new TextDecoder().decode(typeBytes);
    const json = JSON.parse(new TextDecoder().decode(jsonBytes));

    expect(contentType).toBe("application/json");
    expect(json.url).toBe(url);
    expect(json.options.method).toBe(options.method);
  });

  test("serializes URL only if options are not provided", () => {
    const url = "/api/simple";
    const buffer = serializeRequest(url);
    const view = new Uint8Array(buffer);

    const typeLength = view[0];
    const typeBytes = view.slice(1, 1 + typeLength);
    const jsonBytes = view.slice(1 + typeLength);

    const contentType = new TextDecoder().decode(typeBytes);
    const json = JSON.parse(new TextDecoder().decode(jsonBytes));

    expect(contentType).toBe("application/json");
    expect(json.url).toBe(url);
    expect(json).not.toHaveProperty("options");
  });
});

describe("deserializeRequest", () => {
  test("deserializes payload into correct request object", () => {
    const url = "/api/test";
    const options = { method: "GET" };

    const buffer = serializeRequest(url, options);
    const result = deserializeRequest(buffer);

    expect(result.url).toBe(url);
    expect(result.options.method).toBe("GET");
  });

  test("throws error on unsupported content type", () => {
    const encoder = new TextEncoder();
    const badType = encoder.encode("text/plain");
    const json = encoder.encode(JSON.stringify({ url: "/x" }));

    const buffer = new Uint8Array(1 + badType.length + json.length);
    buffer[0] = badType.length;
    buffer.set(badType, 1);
    buffer.set(json, 1 + badType.length);

    expect(() => {
      deserializeRequest(buffer.buffer);
    }).toThrow("Unsupported content type: text/plain");
  });
});
