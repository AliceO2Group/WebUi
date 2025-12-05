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

import { HttpServer } from '@aliceo2/web-ui';

import CentralSystem from './dist/modules/CentralSystem.js';

const http = new HttpServer({ port: 8080, allow: '*' });

http.get(
  '/healthcheck',
  (req, res) => {
    res.status(200).send();
  },
  { public: true }
);

const centralSystemModel = new CentralSystem(4041);
http.get(
  '/tokens/get',
  centralSystemModel.connectionController.getTokensHandler.bind(
    centralSystemModel.connectionController
  ),
  {
    public: true,
  }
);

http.post(
  '/tokens/create',
  centralSystemModel.connectionController.createTokenHandler.bind(
    centralSystemModel.connectionController
  ),
  { public: true }
);

http.post(
  '/tokens/revoke',
  centralSystemModel.connectionController.revokeTokenHandler.bind(
    centralSystemModel.connectionController
  ),
  { public: true }
);

// frontend test endpoints below
const fakeTokens = new Map([
  [
    1,
    {
      tokenId: 1,
      last4chars: 'abcd',
      serviceFrom: 'Service 1',
      serviceTo: 'Service 2',
      exp: '2026-01-12T11:31:12',
      issuer: 'central-system',
      iat: '2025-10-01T10:00:00',
      permissions: ['GET', 'POST'],
    },
  ],
  [
    2,
    {
      tokenId: 2,
      last4chars: 'wxyz',
      serviceFrom: 'Service 3',
      serviceTo: 'Service 4',
      exp: '2025-11-15T08:45:30',
      issuer: 'admin-portal',
      iat: '2025-09-15T14:22:10',
      permissions: ['GET'],
    },
  ],
  [
    3,
    {
      tokenId: 3,
      last4chars: 'efgh',
      serviceFrom: 'Service 2',
      serviceTo: 'Service 1',
      exp: '2026-03-20T16:30:00',
      issuer: 'central-system',
      iat: '2025-10-02T09:15:00',
      permissions: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  ],
  [
    4,
    {
      tokenId: 4,
      last4chars: '1234',
      serviceFrom: 'Service 1',
      serviceTo: 'Service 3',
      exp: '2026-02-05T12:00:00',
      issuer: 'api-gateway',
      iat: '2025-09-25T11:30:45',
      permissions: ['GET', 'PUT'],
    },
  ],
]);

const fakeLogs = new Map([
  [1, []],
  [
    2,
    [
      { id: 1, title: 'The first token ever', content: 'Log for token' },
      {
        id: 3,
        title: 'No second log?',
        content: 'Looks like second log is lost somewhere',
      },
    ],
  ],
]);

http.get(
  '/tokens',
  (req, res) => {
    // Fake long page load
    setTimeout(() => res.status(200).json([...fakeTokens.values()]), 1000);
  },
  { public: true }
);

http.get(
  '/tokens/:tokenId',
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
  '/tokens/:tokenId/logs',
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
