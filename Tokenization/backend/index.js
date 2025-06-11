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

import { HttpServer } from "@aliceo2/web-ui";

import CentralSystem from "./central-system/dist/CentralSystem.js";

const http = new HttpServer({ port: 8080, allow: "*" });

const fakeTokens = new Map([
  [1, { tokenId: 1, validity: "good" }],
  [2, { tokenId: 2, validity: "bad" }],
]);

const fakeLogs = new Map([
  [1, []],
  [
    2,
    [
      { id: 1, title: "The first token ever", content: "Log for token" },
      {
        id: 3,
        title: "No second log?",
        content: "Looks like second log is lost somewhere",
      },
    ],
  ],
]);

http.get(
  "/healthcheck",
  (req, res) => {
    res.status(200).send();
  },
  { public: true }
);

http.get(
  "/tokens",
  (req, res) => {
    // Fake long page load
    setTimeout(() => res.status(200).json([...fakeTokens.values()]), 1000);
  },
  { public: true }
);

http.get(
  "/tokens/:tokenId",
  (req, res) => {
    const tokenId = parseInt(req.params.tokenId, 10);
    const token = fakeTokens.get(tokenId) ?? null;

    if (!token) {
      res.status(404).json({ error: `No token found with id ${tokenId}` });
      return;
    }

    res.status(200).json(token);
  },
  { public: true }
);

http.get(
  "/tokens/:tokenId/logs",
  (req, res) => {
    const tokenId = parseInt(req.params.tokenId, 10);

    // Artificially add an error
    if (tokenId === 3) {
      res.status(500).json({
        error: `An error occurred when trying to load logs for token ${tokenId}`,
      });
      return;
    }

    const logs = fakeLogs.get(tokenId) ?? [];

    if (!logs) {
      res
        .status(404)
        .json({ error: `No logs found found for token ${tokenId}` });
      return;
    }

    setTimeout(() => res.status(200).json(logs), 1000);
  },
  { public: true }
);
