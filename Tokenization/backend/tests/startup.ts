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
import express from "express";
import { CentralSystemWrapper } from "../wrapper/src/central/CentralSystemWrapper";
import { gRPCWrapper } from "../wrapper/src/client/gRPCWrapper";

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
  // TEST CERTIFICATES
  const CERTS_DIR = path.resolve(__dirname, "../authorization");
  const CA = path.join(CERTS_DIR, "ca.crt");
  const CENTRAL_CERT = path.join(CERTS_DIR, "central-system.crt");
  const CENTRAL_KEY = path.join(CERTS_DIR, "central-system.key");

  // --- Client certificates ---
  const A = {
    ca: CA,
    cert: path.join(CERTS_DIR, "client-a-client.crt"),
    key: path.join(CERTS_DIR, "client-a.key"),
    listener: path.join(CERTS_DIR, "client-a-server.crt"),
  };

  const B = {
    ca: CA,
    cert: path.join(CERTS_DIR, "client-b-client.crt"),
    key: path.join(CERTS_DIR, "client-b.key"),
    listener: path.join(CERTS_DIR, "client-b-server.crt"),
  };

  const PROTO = path.resolve(__dirname, "../wrapper/proto/wrapper.proto");

  // --- local HTTP server at Client B ---
  const serverB = await startServerB(8082);

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
      publicKeyPath: A.key, // not needed
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
      publicKeyPath: B.key, // not needed
    },
    listenerCertPath: B.listener,
  });

  // helper to stop everything
  const stop = async () => {
    await stopServerB(serverB);
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

// Starts a simple Express server for E2E testing
export function startServerB(port = 8082) {
  const app = express();
  app.use(express.json());

  app.get("/api/echo", (_req, res) => {
    res.status(200).json({
      message: "Hello from ClientB's local endpoint!",
    });
  });

  app.use((_req, res) => res.sendStatus(404));

  const server = http.createServer(app);
  return new Promise<http.Server>((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

// Stops the Express server
export async function stopServerB(server: http.Server) {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
