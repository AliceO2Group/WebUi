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
import { mockTokens, mockTokenLogs } from './mocks.js';


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
  centralSystemModel.tokenController.getTokensHandler.bind(
    centralSystemModel.tokenController
  ),
  {
    public: true,
  }
);

http.post(
  '/tokens/create',
  centralSystemModel.tokenController.createTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);

http.post(
  '/tokens/revoke',
  centralSystemModel.tokenController.revokeTokenHandler.bind(
    centralSystemModel.tokenController
  ),
  { public: true }
);


http.get(
  '/tokens',
  (req, res) => {
    const {
      serviceFrom,
      serviceTo,
      issuedAfter,
      issuedBefore,
      expiresAfter,
      expiresBefore,
      status,
      ordering,
    } = req.query;

    let filteredTokens = [...mockTokens];

    if (serviceFrom) {
      const serviceFromFilters = Array.isArray(serviceFrom) ? serviceFrom : [serviceFrom];
      if (serviceFromFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => serviceFromFilters.includes(token.serviceFrom));
      }
    }

    if (serviceTo) {
      const serviceToFilters = Array.isArray(serviceTo) ? serviceTo : [serviceTo];
      if (serviceToFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => serviceToFilters.includes(token.serviceTo));
      }
    }

    if (issuedAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) >= new Date(issuedAfter));
    }

    if (issuedBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.iat) <= new Date(issuedBefore));
    }

    if (expiresAfter) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) >= new Date(expiresAfter));
    }

    if (expiresBefore) {
      filteredTokens = filteredTokens.filter(token => new Date(token.exp) <= new Date(expiresBefore));
    }

    if (status) {
      const statusFilters = Array.isArray(status) ? status : [status];
      if (statusFilters.length > 0) {
        filteredTokens = filteredTokens.filter(token => statusFilters.includes(token.status));
      }
    }

    if (ordering) {
      const sortFields = Array.isArray(ordering) ? ordering : [ordering];
      filteredTokens.sort((a, b) => {
        for (const field of sortFields) {
          const [key, directionStr] = field.split(':');
          const direction = directionStr === 'desc' ? -1 : 1;

          const valA = a[key];
          const valB = b[key];

          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
        }
        return 0;
      });
    }

    setTimeout(() => res.status(200).json(filteredTokens), 500);
  },
  { public: true }
);

http.get(
  '/tokens/:tokenId',
  (req, res) => {
    const tokenId = req.params.tokenId;
    const token = mockTokens.find(t => t.tokenId === tokenId) ?? null;

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
    const tokenId = req.params.tokenId;

    const logs = mockTokenLogs[tokenId] ?? [];

    if (!logs) {
      res
        .status(404)
        .json({ error: `No logs found for token ${tokenId}` });
      return;
    }

    setTimeout(() => res.status(200).json(logs), 500);
  },
  { public: true }
);
