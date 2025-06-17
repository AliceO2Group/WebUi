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
