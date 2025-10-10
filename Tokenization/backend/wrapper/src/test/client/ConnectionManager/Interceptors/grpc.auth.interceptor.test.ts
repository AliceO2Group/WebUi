import {
  isRequestAllowed,
  isPermissionUnexpired,
  isSerialNumberMatching,
  getPeerCertFromCall,
} from "../../../../client/ConnectionManager/Interceptors/grpc.auth.interceptor";

jest.mock("jose", () => ({
  importPKCS8: jest.fn(),
  importJWK: jest.fn(),
  compactDecrypt: jest.fn(),
  compactVerify: jest.fn(),
}));

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
    const callback = jest.fn();

    const validPayload = {
      iat: { POST: Math.floor(Date.now() / 1000) - 10 },
      exp: { POST: Math.floor(Date.now() / 1000) + 100 },
      sub: "serial",
      aud: "aud",
      iss: "iss",
      jti: "jti",
    };

    it("returns true for valid payload and unexpired permission", () => {
      expect(isRequestAllowed(validPayload, { method: "POST" }, callback)).toBe(
        true
      );
    });

    it("returns false and calls callback for expired permission", () => {
      const expiredPayload = {
        ...validPayload,
        iat: { POST: Math.floor(Date.now() / 1000) - 100 },
        exp: { POST: Math.floor(Date.now() / 1000) - 10 },
      };
      callback.mockClear();
      expect(
        isRequestAllowed(expiredPayload, { method: "POST" }, callback)
      ).toBe(false);
      expect(callback).toHaveBeenCalled();
    });

    it("returns false and calls callback for invalid payload", () => {
      callback.mockClear();
      expect(isRequestAllowed(undefined, { method: "POST" }, callback)).toBe(
        false
      );
      expect(callback).toHaveBeenCalled();
    });
  });

  describe("isSerialNumberMatching", () => {
    const callback = jest.fn();

    it("returns true if serial numbers match", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = { serialNumber: "ab:cd:ef" };
      expect(isSerialNumberMatching(payload, peerCert, callback)).toBe(true);
    });

    it("returns false and calls callback if serial numbers do not match", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = { serialNumber: "123456" };
      callback.mockClear();
      expect(isSerialNumberMatching(payload, peerCert, callback)).toBe(false);
      expect(callback).toHaveBeenCalled();
    });

    it("returns false and calls callback if serial number is missing", () => {
      const payload = { sub: "ABCDEF" } as any;
      const peerCert = {};
      callback.mockClear();
      expect(isSerialNumberMatching(payload, peerCert, callback)).toBe(false);
      expect(callback).toHaveBeenCalled();
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
      expect(getPeerCertFromCall({})).toBeUndefined();
    });
  });
});
