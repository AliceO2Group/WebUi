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

import { Connection } from "../../../client/Connection/Connection";
import { ConnectionDirection } from "../../../models/message.model";
import { ConnectionStatus } from "../../../models/connection.model";
import {
  TOKEN_REASON_HEADER,
  TokenAuthReason,
  TokenPayload,
} from "../../../models/token.model";

jest.mock(
  "@aliceo2/web-ui",
  () => ({
    LogManager: {
      getLogger: jest.fn(() => ({
        warnMessage: jest.fn(),
        errorMessage: jest.fn(),
      })),
    },
  }),
  { virtual: true }
);

const mockRenewToken = jest.fn();

describe("Connection", () => {
  const jweToken = "test-token";
  const targetAddress = "localhost:50051";
  const direction = ConnectionDirection.SENDING;

  let connection: Connection;

  beforeEach(() => {
    connection = new Connection(
      jweToken,
      targetAddress,
      direction,
      mockRenewToken,
      "serial-123"
    );
    mockRenewToken.mockClear();
  });

  it("should initialize with correct values", () => {
    expect(connection.getToken()).toBe(jweToken);
    expect(connection.getTargetAddress()).toBe(targetAddress);
    expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
    expect(connection.getSerialNumber()).toBe("serial-123");
    expect(typeof connection.getLastActiveTimestamp()).toBe("number");
  });

  it("should update and get serial number", () => {
    connection.setSerialNumber("new-serial");
    expect(connection.getSerialNumber()).toBe("new-serial");
  });

  it("should handle new token", () => {
    connection.handleNewToken("new-token");
    expect(connection.getToken()).toBe("new-token");
    expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
  });

  it("should handle token revocation", () => {
    connection.handleRevokeToken();
    expect(connection.getToken()).toBe("");
    expect(connection.getStatus()).toBe(ConnectionStatus.UNAUTHORIZED);
  });

  it("should handle successful authentication", () => {
    const payload: TokenPayload = {
      sub: "user",
      exp: Date.now() + 1000,
    } as any;
    connection.handleSuccessfulAuth(payload);
    expect(connection.getCachedTokenPayload()).toBe(payload);
    expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
    expect(typeof connection.getLastActiveTimestamp()).toBe("number");
  });

  it("should increment auth failures and block after 5 failures", () => {
    for (let i = 0; i < 4; i++) {
      expect(connection.handleFailedAuth()).toBe(i + 1);
      expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
    }
    expect(connection.handleFailedAuth()).toBe(5);
    expect(connection.getStatus()).toBe(ConnectionStatus.BLOCKED);
  });

  it("should update status", () => {
    connection.updateStatus(ConnectionStatus.BLOCKED);
    expect(connection.getStatus()).toBe(ConnectionStatus.BLOCKED);
  });

  it("should attach grpc client", () => {
    const grpcClient = { Fetch: jest.fn() };
    connection.attachGrpcClient(grpcClient);
    // @ts-ignore
    expect(connection.peerClient).toBe(grpcClient);
  });

  describe("fetch", () => {
    let grpcClient: any;

    beforeEach(() => {
      grpcClient = {
        Fetch: jest.fn(),
      };
      connection.attachGrpcClient(grpcClient);
      connection.updateStatus(ConnectionStatus.CONNECTED);
    });

    it("should throw if peerClient is not attached", async () => {
      const c = new Connection(
        jweToken,
        targetAddress,
        direction,
        mockRenewToken
      );
      await expect(c.fetch()).rejects.toThrow(/Peer client not attached/);
    });

    it("should throw if connection is blocked", async () => {
      connection.updateStatus(ConnectionStatus.BLOCKED);
      await expect(connection.fetch()).rejects.toThrow(/Connection is blocked/);
    });

    it("should perform a successful fetch", async () => {
      grpcClient.Fetch.mockImplementation((_req: any, _meta: any, cb: any) => {
        cb(null, {
          status: 200,
          headers: { foo: "bar" },
          body: Buffer.from("ok"),
        });
      });
      const res = await connection.fetch({ method: "GET", path: "/test" });
      expect(res.status).toBe(200);
      expect(res.headers.foo).toBe("bar");
      expect(await res.text()).toBe("ok");
    });

    it("should handle token renewal and retry fetch", async () => {
      // Simulate first fetch fails with renewable error, then succeeds
      let callCount = 0;
      grpcClient.Fetch.mockImplementation((_req: any, meta: any, cb: any) => {
        callCount++;
        if (callCount === 1) {
          const err: any = new Error("Token expired");
          err.metadataMap = new Map([
            [TOKEN_REASON_HEADER, TokenAuthReason.PERMISSION_EXPIRED],
          ]);
          cb(err);
        } else {
          cb(null, { status: 200, headers: {}, body: Buffer.from("retry-ok") });
        }
      });

      // Patch handleNewToken to simulate token refresh
      setTimeout(() => {
        connection.handleNewToken("refreshed-token");
      }, 10);

      const res = await connection.fetch({ method: "POST", path: "/renew" });
      expect(res.status).toBe(200);
      expect(await res.text()).toBe("retry-ok");
      expect(mockRenewToken).toHaveBeenCalled();
    });

    it("should throw on non-renewable error", async () => {
      grpcClient.Fetch.mockImplementation((_req: any, _meta: any, cb: any) => {
        const err: any = new Error("Forbidden");
        err.metadataMap = new Map([
          [TOKEN_REASON_HEADER, TokenAuthReason.PERMISSION_FORBIDDEN],
        ]);
        cb(err);
      });
      await expect(connection.fetch({ path: "/fail" })).rejects.toThrow(
        "Forbidden"
      );
    });
  });

  describe("createSslTunnel", () => {
    const peerCtor = jest.fn();
    const certs = {
      caCert: Buffer.from("ca"),
      clientCert: Buffer.from("cert"),
      clientKey: Buffer.from("key"),
    };

    it("should throw if certs are missing", () => {
      expect(() =>
        connection.createSslTunnel(peerCtor, {
          caCert: Buffer.from("ca"),
          clientCert: undefined as any,
          clientKey: Buffer.from("key"),
        })
      ).toThrow(/Connection certificates are required/);
    });

    it("should create ssl tunnel and set status", () => {
      const grpcCreds = {};
      const oldCreateSsl = jest
        .spyOn(require("@grpc/grpc-js").credentials, "createSsl")
        .mockReturnValue(grpcCreds as any);
      peerCtor.mockImplementation(() => ({}));
      connection.createSslTunnel(peerCtor, certs);
      expect(peerCtor).toHaveBeenCalledWith(targetAddress, grpcCreds);
      expect(connection.getStatus()).toBe(ConnectionStatus.CONNECTED);
      oldCreateSsl.mockRestore();
    });
  });
});
