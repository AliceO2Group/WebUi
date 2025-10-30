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

jest.mock("jose", () => ({
  importPKCS8: jest.fn(),
  importJWK: jest.fn(),
  compactDecrypt: jest.fn(),
  compactVerify: jest.fn(),
}));

import { GRPCAuthInterceptor } from "../../../../client/ConnectionManager/Interceptors/grpc.auth.interceptor";

const {
  isPermissionUnexpired,
  isRequestAllowed,
  isSerialNumberMatching,
  getPeerCertFromCall,
} = GRPCAuthInterceptor as typeof GRPCAuthInterceptor;

describe("grpc.auth.interceptor", () => {
  describe("isPermissionUnexpired", () => {
    it("returns true if current time is within iat and exp", () => {
      const now = Math.floor(Date.now() / 1000);
      expect(isPermissionUnexpired(now - 10, now + 10)).toBe(true);
    });

    it("returns false if current time is after exp", () => {
      const now = Math.floor(Date.now() / 1000);
      expect(isPermissionUnexpired(now - 20, now - 10)).toBe(false);
    });

    it("returns false if current time is before iat", () => {
      const now = Math.floor(Date.now() / 1000);
      expect(isPermissionUnexpired(now + 10, now + 20)).toBe(false);
    });
  });

  describe("isRequestAllowed", () => {
    const now = Math.floor(Date.now() / 1000);
    const validPayload = {
      iat: { POST: now - 10 },
      exp: { POST: now + 100 },
      sub: "serial",
      aud: "aud",
      iss: "iss",
      jti: "jti",
    } as any;

    it("returns true for valid payload and unexpired permission", () => {
      expect(isRequestAllowed(validPayload, { method: "POST" })).toEqual({
        isAllowed: true,
        isUnexpired: true,
      });
    });

    it("returns false and calls callback for expired permission", () => {
      const expiredPayload = {
        ...validPayload,
        iat: { POST: now - 100 },
        exp: { POST: now - 10 },
      } as any;
      expect(isRequestAllowed(expiredPayload, { method: "POST" })).toEqual({
        isAllowed: false,
        isUnexpired: false,
      });
    });

    it("returns false and calls callback for invalid payload", () => {
      expect(isRequestAllowed(undefined, { method: "POST" })).toEqual({
        isAllowed: false,
        isUnexpired: true,
      });
    });
  });

  describe("isSerialNumberMatching", () => {
    it("returns true if serial numbers match", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = { serialNumber: "ab:cd:ef" };
      expect(isSerialNumberMatching(payload, peerCert)).toBe(true);
    });

    it("returns false and calls callback if serial numbers do not match", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = { serialNumber: "123456" };
      expect(isSerialNumberMatching(payload, peerCert)).toBe(false);
    });

    it("returns false and calls callback if serial number is missing", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = {};
      expect(isSerialNumberMatching(payload, peerCert)).toBe(false);
    });
  });

  describe("getPeerCertFromCall", () => {
    it("returns peer certificate from nested call object", () => {
      const fakeCert = { serialNumber: "123" };
      const call = {
        call: {
          stream: {
            session: {
              socket: {
                getPeerCertificate: jest.fn().mockReturnValue(fakeCert),
              },
            },
          },
        },
      };
      expect(getPeerCertFromCall(call)).toBe(fakeCert);
    });

    it("returns undefined if structure is missing", () => {
      expect(getPeerCertFromCall({} as any)).toBeUndefined();
    });
  });
});
