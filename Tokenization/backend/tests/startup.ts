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

import http from "http";
import path from "path";
import { CentralSystemWrapper } from "../wrapper/central/CentralSystemWrapper";
import { gRPCWrapper } from "../wrapper/client/gRPCWrapper";

// Handles to the started E2E environment
export interface TestEnvHandles {
  central: CentralSystemWrapper;
  wrapperA: gRPCWrapper;
  wrapperB: gRPCWrapper;
  serverB: http.Server;
  stop: () => Promise<void>;
}

/**
 * Starts Central + Client A + Client B and a local HTTP endpoint on B.
 * - Central: mTLS gRPC server on :50051
 * - Client A: peer listener on :40041
 * - Client B: peer listener on :40042, HTTP echo on :8082
 */
export async function startTestEnvironment(): Promise<TestEnvHandles> {
  // TEST CERTIFICATES ?????????????????????????
  const CERTS_DIR = path.resolve(__dirname, "../certs");
  const CA = path.join(CERTS_DIR, "ca.crt");
  const CENTRAL_CERT = path.join(CERTS_DIR, "central.crt");
  const CENTRAL_KEY = path.join(CERTS_DIR, "central.key");

  // --- Client certificates ---
  const A = {
    ca: CA,
    cert: path.join(CERTS_DIR, "a.sender.crt"),
    key: path.join(CERTS_DIR, "a.key"),
    listener: path.join(CERTS_DIR, "a.listener.crt"),
  };

  const B = {
    ca: CA,
    cert: path.join(CERTS_DIR, "b.sender.crt"),
    key: path.join(CERTS_DIR, "b.key"),
    listener: path.join(CERTS_DIR, "b.listener.crt"),
  };

  const PROTO = path.resolve(__dirname, "../wrapper/proto/wrapper.proto");

  // --- local HTTP server at Client B ---
  const serverB = http.createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/echo") {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
    res.writeHead(404);
    res.end();
  });

  await new Promise<void>((resolve) => serverB.listen(8082, resolve));

  // --- Central System ---
  const central = new CentralSystemWrapper({
    protoPath: PROTO,
    port: 50051,
    serverCerts: {
      caCertPath: CA,
      certPath: CENTRAL_CERT,
      keyPath: CENTRAL_KEY,
    },
    commandHandlers: [], // register command handlers
  });
  central.listen();

  // Give the server a tick to bind
  await sleep(150);

  // ========================= WRAPPERS =========================
  // --- Client A ---
  const wrapperA = new gRPCWrapper({
    protoPath: PROTO,
    centralAddress: "localhost:50051",
    clientCerts: {
      caCertPath: A.ca,
      certPath: A.cert,
      privateKeyPath: A.key,
    },
    listenerCertPath: A.listener,
  });
  wrapperA.connectToCentralSystem();
  await wrapperA.listenForPeers(40041, "http://localhost:8081/api/");

  // --- Client B ---
  const wrapperB = new gRPCWrapper({
    protoPath: PROTO,
    centralAddress: "localhost:50051",
    clientCerts: {
      caCertPath: B.ca,
      certPath: B.cert,
      privateKeyPath: B.key,
    },
    listenerCertPath: B.listener,
  });

  // helper to stop everything
  const stop = async () => {
    await new Promise<void>((resolve) => serverB.close(() => resolve()));
    process.exitCode = 0;
  };

  return { central, wrapperA, wrapperB, serverB, stop };
}

// Waits for a condition to be true, polling every stepMs, with a timeout
export async function waitFor(
  cond: () => boolean,
  timeoutMs = 4000,
  stepMs = 50
): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (cond()) return;
    await sleep(stepMs);
  }
  throw new Error("waitFor timeout");
}

// Simple sleep utility
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
